import React, { useState } from 'react';
import './index.css';

export default function KanbanBoard({ board, columns, tasks, onBack, onMoveTask, onCreateTask }) {
    const [taskTitle, setTaskTitle] = useState('');

    return (
        <div>
            <div className="workspace-header">
                <button className="btn-back" onClick={onBack}>← Back to Overview</button>
                <h2 style={{ margin: 0 }}>{board.name}</h2>
                <span className="tenant-badge">Multi-Tenant Scoped Isolation</span>
            </div>

            <div className="kanban-scrollway">
                {columns.map(col => {
                    const colTasks = tasks.filter(t => t.column_id === col.id);
                    return (
                        <div key={col.id} className="kanban-column">
                            <div className="column-title-bar">
                                <span>{col.name}</span>
                                <span>{colTasks.length}</span>
                            </div>

                            <div>
                                {colTasks.map((task, idx) => (
                                    <div key={task.id} className="task-card">
                                        <div style={{ fontWeight: '500' }}>{task.title}</div>
                                        <div style={{ fontSize: '12px', color: '#6b778c', marginTop: '4px' }}>{task.description}</div>

                                        <div className="task-meta">
                                            <span className="version-tag">Ver: {task.version}</span>
                                            <div>
                                                {columns.map(c => c.id !== col.id && (
                                                    <button
                                                        key={c.id}
                                                        className="btn-shift"
                                                        onClick={() => onMoveTask(task.id, c.id, idx + 1, task.version)}
                                                    >
                                                        → {c.name.substring(0, 4)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form className="task-entry-form" onSubmit={(e) => {
                                e.preventDefault();
                                if (!taskTitle) return;
                                onCreateTask(col.id, taskTitle);
                                setTaskTitle('');
                            }}>
                                <input className="task-entry-input" type="text" placeholder="+ New card title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                                <button type="submit" style={{ padding: '4px 8px', cursor: 'pointer' }}>Add</button>
                            </form>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}