// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [klass, setKlass] = useState('class-A');
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleRegister(e) {
        e.preventDefault();
        setLoading(true);

        try {
            // Step 1: create user
            const res = await axios.post('http://localhost:4000/api/register-user', {
                name,
                email,
                password,
                role: 'student',
                class: klass
            });

            const userId = res.data.id;

            // Step 2: upload photo (optional but recommended)
            if (photo) {
                const form = new FormData();
                form.append('photo', photo);
                form.append('user_id', userId);

                await axios.post('http://localhost:4000/api/upload-photo', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            alert('Registration successful! Please log in.');
            navigate('/login');

        } catch (err) {
            console.error(err);
            alert('Registration failed. Email may already exist.');
        }

        setLoading(false);
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-base-200 rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">Student Registration</h2>

            <form onSubmit={handleRegister} className="flex flex-col gap-4" encType="multipart/form-data">
                <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

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

                <select
                    className="select select-bordered w-full"
                    value={klass}
                    onChange={(e) => setKlass(e.target.value)}
                >
                    <option value="class-A">class-A</option>
                    <option value="class-B">class-B</option>
                    <option value="class-C">class-C</option>
                </select>

                <div>
                    <label className="block mb-1">Upload Face Photo (Required for recognition)</label>
                    <input
                        type="file"
                        className="file-input file-input-bordered w-full"
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files[0])}
                    />
                </div>

                <button className="btn btn-primary w-full" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>

            <p className="mt-4 text-center">
                Already have an account? <a className="link" href="/login">Login</a>
            </p>
        </div>
    );
}