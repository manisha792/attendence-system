// frontend/src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [user, setUser] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!token) return navigate('/login');
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser(payload);
            loadAttendance(payload.id);
        } catch {
            navigate('/login');
        }
    }, []);

    async function loadAttendance(uid) {
        try {
            const res = await axios.get('http://localhost:4000/api/attendance', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setHistory(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    async function uploadPhoto() {
        if (!photo) return alert('Select a photo first');
        try {
            const form = new FormData();
            form.append('photo', photo);
            form.append('user_id', user.id);

            await axios.post('http://localhost:4000/api/upload-photo', form, {
                headers: {
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Photo uploaded successfully');
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
    }

    async function addRemark(attId) {
        const remark = prompt('Enter your remark (issue with attendance):');
        if (!remark) return;

        try {
            await axios.post(
                `http://localhost:4000/api/attendance/${attId}/remark`,
                { remark },
                { headers: { Authorization: 'Bearer ' + token } }
            );

            alert('Remark added');
            loadAttendance(user.id);
        } catch (e) {
            alert('Cannot add remark or remark already exists');
        }
    }

    function logout() {
        localStorage.removeItem('token');
        navigate('/login');
    }

    if (!user) return <div className="p-6">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-base-200 rounded-xl shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Student Dashboard</h2>
                <button className="btn" onClick={logout}>Logout</button>
            </div>

            <div className="bg-base-100 p-4 rounded-lg shadow mb-6">
                <h3 className="text-xl font-semibold">Upload / Update Face Photo</h3>
                <input
                    type="file"
                    className="file-input file-input-bordered w-full mt-3"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                />
                <button className="btn btn-primary mt-3" onClick={uploadPhoto}>Upload Photo</button>
            </div>

            <h3 className="text-xl font-semibold mb-3">Your Attendance History</h3>
            <div className="flex flex-col gap-4">
                {history.length === 0 && <p>No attendance records yet.</p>}

                {history.map((att) => (
                    <div key={att.id} className="bg-base-100 p-4 rounded-lg shadow">
                        <p><strong>Date:</strong> {new Date(att.timestamp).toLocaleString()}</p>
                        <p><strong>Note:</strong> {att.note || '—'}</p>
                        <p><strong>Remark:</strong> {att.remark || '—'}</p>

                        {!att.remark && (
                            <button
                                className="btn btn-sm btn-warning mt-2"
                                onClick={() => addRemark(att.id)}
                            >
                                Add Remark
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}