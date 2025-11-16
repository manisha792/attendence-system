// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:4000/api/login', {
                email,
                password
            });

            const { token, user } = res.data;
            localStorage.setItem('token', token);

            if (user.role === 'teacher') navigate('/teacher');
            else navigate('/student');

        } catch (err) {
            alert('Invalid credentials');
        }
        setLoading(false);
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-base-200 rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                    type="email"
                    className="input input-bordered w-full"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    className="input input-bordered w-full"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button className="btn btn-primary w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <p className="mt-4 text-center">
                New user? <a className="link" href="/register">Register here</a>
            </p>
        </div>
    );
}