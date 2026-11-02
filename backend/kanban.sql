--  ENABLE REFERENTIAL INTEGRITY CONSTRAINTS
PRAGMA foreign_keys = ON;
-- CREATE CORE HIERARCHY AND MULTI-TENANT ISOLATION TABLES
-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
-- 2. Tenants (Enforces parent organization grouping)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
-- 3. Users System Records
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
-- 4. Memberships Context (Manages cross-tenant access control)
CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    tenant_id TEXT,
    -- Nullable to allow global organization administration access
    role TEXT NOT NULL,
    -- e.g., 'Org Admin', 'Tenant Admin', 'Member'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
-- 5. Kanban Boards (Bound cleanly to unique Tenant nodes)
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
-- 6. Workflow Columns (Track processing paths)
CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
-- 7. Tasks Matrix (Features position index and version monitoring)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    column_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    position INTEGER NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);
-- 8. Activity Logs & Security Audits
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    -- e.g., 'CREATE_TASK', 'MOVE_TASK'
    details TEXT,
    -- JSON string payload storage
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- ====================================================================
-- STEP 3: CREATE PERFORMANCE ENFORCEMENT QUERY INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_tenants_org_id ON tenants(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_tenant_id ON boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
-- ====================================================================
-- STEP 4: SEED SAMPLE DATA RECORDS
-- ====================================================================
-- Seed Organization
INSERT
    OR IGNORE INTO organizations (id, name)
VALUES ('org-101', 'Acme Global Corp');
-- Seed Regional Sub-Tenants
INSERT
    OR IGNORE INTO tenants (id, organization_id, name)
VALUES (
        'tenant-hyd',
        'org-101',
        'Hyderabad Engineering Branch'
    );
INSERT
    OR IGNORE INTO tenants (id, organization_id, name)
VALUES (
        'tenant-blr',
        'org-101',
        'Bangalore Operations Branch'
    );
-- Seed Users
INSERT
    OR IGNORE INTO users (id, name, email, password_hash)
VALUES (
        'usr-001',
        'Anish Kumar',
        'anish@acme.com',
        '$2b$10$SampleHashedPasswordTextStrings'
    );
INSERT
    OR IGNORE INTO users (id, name, email, password_hash)
VALUES (
        'usr-002',
        'Sana Reddy',
        'sana@acme.com',
        '$2b$10$SampleHashedPasswordTextStrings'
    );
-- Assign Account Memberships
INSERT
    OR IGNORE INTO memberships (id, user_id, organization_id, tenant_id, role)
VALUES (
        'mem-001',
        'usr-001',
        'org-101',
        'tenant-hyd',
        'Tenant Admin'
    );
INSERT
    OR IGNORE INTO memberships (id, user_id, organization_id, tenant_id, role)
VALUES (
        'mem-002',
        'usr-002',
        'org-101',
        'tenant-blr',
        'Member'
    );
-- Seed Project Boards
INSERT
    OR IGNORE INTO boards (
        id,
        organization_id,
        tenant_id,
        name,
        description,
        created_by
    )
VALUES (
        'board-q4',
        'org-101',
        'tenant-hyd',
        'Q4 Product Roadmap',
        'Core engineering features board',
        'usr-001'
    );
-- Seed Workflow Steps (Columns)
INSERT
    OR IGNORE INTO columns (id, board_id, tenant_id, name, position)
VALUES ('col-todo', 'board-q4', 'tenant-hyd', 'To Do', 1);
INSERT
    OR IGNORE INTO columns (id, board_id, tenant_id, name, position)
VALUES (
        'col-progress',
        'board-q4',
        'tenant-hyd',
        'In Progress',
        2
    );
-- Seed Sample Tasks
INSERT
    OR IGNORE INTO tasks (
        id,
        board_id,
        column_id,
        tenant_id,
        title,
        description,
        assigned_to,
        position
    )
VALUES (
        'task-001',
        'board-q4',
        'col-todo',
        'tenant-hyd',
        'Setup Express Middleware Layers',
        'Implement tenant routing security strategies.',
        'usr-001',
        1
    );
INSERT
    OR IGNORE INTO tasks (
        id,
        board_id,
        column_id,
        tenant_id,
        title,
        description,
        assigned_to,
        position
    )
VALUES (
        'task-002',
        'board-q4',
        'col-progress',
        'tenant-hyd',
        'Connect SQLite Engine',
        'Finalize initialization schema validation scripts.',
        'usr-001',
        1
    );