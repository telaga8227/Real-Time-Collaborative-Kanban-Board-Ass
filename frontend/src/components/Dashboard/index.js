import './index.css';

export default function Dashboard({ boards, onSelectBoard }) {
    return (
        <div>
            <h2 className="dashboard-title">Tenant Partitioned Boards</h2>
            <div className="board-grid">
                {boards.length === 0 ? (
                    <p style={{ color: '#6b778c' }}>No isolated boards discovered inside this tenant partition.</p>
                ) : (
                    boards.map(board => (
                        <div key={board.id} className="board-card" onClick={() => onSelectBoard(board)}>
                            <h3>{board.name}</h3>
                            <p>{board.description || 'No summary parameters provided.'}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}