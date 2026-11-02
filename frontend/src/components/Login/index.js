import { useState } from 'react';
import './index.css';

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) return;

        // Simulate database mapping strings dynamically
        const simulatedUserId = email.includes('sana') ? 'usr-002' : 'usr-001';
        const simulatedName = email.includes('sana') ? 'Sana Reddy' : 'Anish Kumar';
        const inferredTenant = email.includes('sana') ? 'tenant-blr' : 'tenant-hyd';

        onLoginSuccess({
            id: simulatedUserId,
            name: simulatedName,
            email: email,
            tenantId: inferredTenant
        });
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Sign In to Kanban</h2>
            <form onSubmit={handleSubmit}>
                <input className="auth-input" type="email" placeholder="Corporate email (anish@acme.com)" value={email} onChange={e => setEmail(e.target.value)} required />
                <input className="auth-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <div>
                    <button className="auth-button" type="submit">Authenticate Account</button>
                </div>

            </form>
            <p className="auth-hint">Demo context users: anish@acme.com or sana@acme.com</p>
        </div>
    );
}