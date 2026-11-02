import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTenant, setActiveTenant] = useState('tenant-hyd');
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [systemError, setSystemError] = useState(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-tenant-id': activeTenant,
    'x-user-id': user ? user.id : 'usr-001'
  });

  const fetchBoards = async () => {
    try {
      setSystemError(null);
      const res = await fetch('http://localhost:5000/api/boards', { headers: getHeaders() });
      if (!res.ok) throw new Error("Tenant isolation lookup denied access routing permissions.");
      setBoards(await res.json());
    } catch (err) { setSystemError(err.message); }
  };

  const loadWorkspace = async (board) => {
    try {
      setSystemError(null);
      const resCol = await fetch(`http://localhost:5000/api/boards/${board.id}/columns, { headers: getHeaders() }`);
      const resTask = await fetch(`http://localhost:5000/api/boards/${board.id}/tasks, { headers: getHeaders() }`);
      setColumns(await resCol.json());
      setTasks(await resTask.json());
      setActiveBoard(board);
    } catch (err) { setSystemError("Failed resolving board structural maps."); }
  };

  useEffect(() => {
    if (user) { fetchBoards(); if (activeBoard) loadWorkspace(activeBoard); }
  }, [activeTenant, user]);

  const handleMoveTask = async (taskId, nextColId, pos, currentVer) => {
    setSystemError(null);
    const historicalTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, column_id: nextColId, version: t.version + 1 } : t));

    try {
      const activeTask = tasks.find(t => t.id === taskId);
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ title: activeTask.title, description: activeTask.description, column_id: nextColId, position: pos, current_version: currentVer })
      });
      if (!res.ok) {
        setTasks(historicalTasks);
        if (res.status === 409) setSystemError("Optimistic Lock Conflict: Data was modified externally. Please refresh.");
      }
    } catch { setTasks(historicalTasks); }
  };

  const handleCreateTask = async (columnId, title) => {
    try {
      await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(`{ id: task-${Date.now()}, board_id: activeBoard.id, column_id: columnId, title, description: 'Created modularly.', position: tasks.length + 1 }`)
      });
      loadWorkspace(activeBoard);
    } catch { setSystemError("Task creation failure."); }
  };

  if (!user) return <Login onLoginSuccess={(loggedInUser) => { setUser(loggedInUser); setActiveTenant(loggedInUser.tenantId); }} />;

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', background: '#fff', padding: '15px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#0052cc' }}>Collaborative Workspace Panel</h1>
          <span style={{ fontSize: '12px' }}>User: {user.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={activeTenant} onChange={e => { setActiveTenant(e.target.value); setActiveBoard(null); }} style={{ padding: '6px' }}>
            <option value="tenant-hyd">Hyderabad Branch (tenant-hyd)</option>
            <option value="tenant-blr">Bangalore Branch (tenant-blr)</option>
          </select>
          <button onClick={() => setUser(null)} style={{ padding: '6px 12px', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </header>

      {systemError && <div style={{ backgroundColor: '#ffebe6', color: '#bf2600', padding: '12px', borderRadius: '4px', marginBottom: '15px' }}>⚠️ {systemError}</div>}

      {!activeBoard ? (
        <Dashboard boards={boards} onSelectBoard={loadWorkspace} />
      ) : (
        <KanbanBoard board={activeBoard} columns={columns} tasks={tasks} onBack={() => setActiveBoard(null)} onMoveTask={handleMoveTask} onCreateTask={handleCreateTask} />
      )}
    </div>
  );
}