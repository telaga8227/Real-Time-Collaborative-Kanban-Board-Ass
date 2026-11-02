const express = require('express');
const app = express()
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const cors = require('cors')

const PORT = 5000;
app.use(cors());
app.use(express.json());

// Connect to SQLite Database
const dbpath = path.join(__dirname, 'kanban.db');
let db = null;
const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename: dbpath,
            driver: sqlite3.Database,
        });
        app.listen(5000, () => {
            console.log("server running at http://localhost:5000/")
        })
    }
    catch (e) {
        console.log(`DBError : ${e.message}`)
        process.exit(1);
    }
}
initializeDbAndServer()

//  MIDDLEWARE LAYER (TENANT ISOLATION & VALIDATION)

const authenticateTenant = async (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];
    const userId = req.headers['x-user-id'];

    if (!tenantId || !userId) {
        return res.status(400).json({ error: "Missing x-tenant-id or x-user-id header configuration." });
    }

    try {
        // Verify user membership role exists inside this tenant boundary context
        const membership = await db.get(
            `SELECT role FROM memberships WHERE user_id = ? AND tenant_id = ?`,
            [userId, tenantId]
        );

        if (!membership) {
            return res.status(403).json({ error: "Access Denied: User is not authorized to access this tenant workspace." });
        }

        req.tenantId = tenantId;
        req.userId = userId;
        req.userRole = membership.role;
        next();
    } catch (error) {
        res.status(500).json({ error: "Internal Authentication Check Failed: " + error.message });
    }
};

// Apply tenant isolation checking rule across all core endpoints
app.use('/api', authenticateTenant);


//  BOARDS ENDPOINTS (STRICTLY SCOPED TO ACTIVE TENANT)


// Fetch all boards belonging exclusively to the tenant context
app.get('/api/boards', async (req, res) => {
    try {
        const boards = await db.all(
            `SELECT * FROM boards WHERE tenant_id = ?`,
            [req.tenantId]
        );
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new board node
app.post('/api/boards', async (req, res) => {
    const { id, organization_id, name, description } = req.body;
    if (!id || !organization_id || !name) {
        return res.status(400).json({ error: "Missing required board payload arguments fields." });
    }
    try {
        await db.run(
            `INSERT INTO boards (id, organization_id, tenant_id, name, description, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, organization_id, req.tenantId, name, description, req.userId]
        );

        // Track operation in Security Audit Logs
        await db.run(
            `INSERT INTO activity_logs (id, tenant_id, user_id, entity_id, action, details) VALUES (?, ?, ?, ?, ?, ?)`,
            [`log-${Date.now()}`, req.tenantId, req.userId, id, 'CREATE_BOARD', JSON.stringify({ name })]
        );

        res.status(201).json({ message: "Kanban Board created successfully under your tenant environment." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// COLUMNS ENDPOINTS (WORKFLOW STRUCTURES)


// Fetch all processing paths/columns linked to a board
app.get('/api/boards/:boardId/columns', async (req, res) => {
    try {
        const columns = await db.all(
            `SELECT * FROM columns WHERE board_id = ? AND tenant_id = ? ORDER BY position ASC`,
            [req.params.boardId, req.tenantId]
        );
        res.json(columns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// TASKS ENDPOINTS & OPTIMISTIC LOCKING VERIFICATION


// Fetch tasks scoped inside the isolated workspace view boundaries
app.get('/api/boards/:boardId/tasks', async (req, res) => {
    try {
        const tasks = await db.all(
            `SELECT * FROM tasks WHERE board_id = ? AND tenant_id = ? ORDER BY position ASC`,
            [req.params.boardId, req.tenantId]
        );
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new card assignment task
app.post('/api/tasks', async (req, res) => {
    const { id, board_id, column_id, title, description, assigned_to, position } = req.body;
    try {
        await db.run(
            `INSERT INTO tasks (id, board_id, column_id, tenant_id, title, description, assigned_to, position, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, board_id, column_id, req.tenantId, title, description, assigned_to, position]
        );

        await db.run(
            `INSERT INTO activity_logs (id, tenant_id, user_id, entity_id, action, details) VALUES (?, ?, ?, ?, ?, ?)`,
            [`log-${Date.now()}`, req.tenantId, req.userId, id, 'CREATE_TASK', JSON.stringify({ title })]
        );

        res.status(201).json({ message: "Task instantiated successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update task with secure, optimistic lock version matching verification checks
app.put('/api/tasks/:id', async (req, res) => {
    const { title, description, column_id, position, current_version } = req.body;

    try {
        // Fetch active object layout structure to match current versioning state
        const task = await db.get(`SELECT version FROM tasks WHERE id = ? AND tenant_id = ?`, [req.params.id, req.tenantId]);

        if (!task) {
            return res.status(404).json({ error: "Target task asset entity records could not be found." });
        }

        // Core Concurrency Check: Halt processing if the versions mismatch
        if (task.version !== current_version) {
            return res.status(409).json({ error: "Concurrency Mismatch Error: The data was modified by another request pipeline session. Please refresh your views." });
        }

        const newVersion = task.version + 1;
        await db.run(
            `UPDATE tasks SET title = ?, description = ?, column_id = ?, position = ?, version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`,
            [title, description, column_id, position, newVersion, req.params.id, req.tenantId]
        );

        res.json({ message: "Task details modified successfully.", operationalVersion: newVersion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//  SECURITY AUDIT & ACTIVITY LOGGER INTERFACE

app.get('/api/audit-logs', async (req, res) => {
    // Restrict detailed tracking logs strictly to Admin account roles
    if (req.userRole !== 'Org Admin' && req.userRole !== 'Tenant Admin') {
        return res.status(403).json({ error: "Access Denied: Administrator security access clearance privileges are required." });
    }

    try {
        const logs = await db.all(
            `SELECT * FROM activity_logs WHERE tenant_id = ? ORDER BY created_at DESC`,
            [req.tenantId]
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

