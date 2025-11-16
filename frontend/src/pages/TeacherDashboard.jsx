// frontend/src/pages/TeacherDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
    const navigate = useNavigate();

    function logout() {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-base-200 rounded-xl shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
                <button className="btn" onClick={logout}>Logout</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manage Students */}
                <div className="bg-base-100 p-5 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-2">Students</h3>
                    <p className="mb-3 text-sm opacity-75">View students, check photos, register face descriptors.</p>
                    <button className="btn btn-primary w-full" onClick={() => navigate('/teacher/users')}>
                        Manage Students
                    </button>
                </div>

                {/* Attendance Viewer */}
                <div className="bg-base-100 p-5 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-2">Attendance</h3>
                    <p className="mb-3 text-sm opacity-75">View attendance by class, edit records, see remarks.</p>
                    <button className="btn btn-secondary w-full" onClick={() => navigate('/teacher/attendance')}>
                        View Attendance
                    </button>
                </div>

                {/* Live Scanner */}
                <div className="bg-base-100 p-5 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-2">Live Scanner</h3>
                    <p className="mb-3 text-sm opacity-75">Real-time face recognition and attendance recording.</p>
                    <button className="btn btn-info w-full" onClick={() => navigate('/teacher/scan')}>
                        Start Live Scanner
                    </button>
                </div>

                {/* Export CSV */}
                <div className="bg-base-100 p-5 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-2">Export CSV</h3>
                    <p className="mb-3 text-sm opacity-75">Export today's attendance as a CSV file.</p>
                    <button
                        className="btn btn-accent w-full"
                        onClick={async () => {
                            try {
                                const token = localStorage.getItem('token');
                                const res = await fetch('http://localhost:4000/api/export-attendance', {
                                    headers: {
                                        Authorization: 'Bearer ' + token
                                    }
                                });

                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'attendance.csv';
                                a.click();
                            } catch (e) {
                                alert('Export failed');
                            }
                        }}
                    >
                        Export CSV
                    </button>
                </div>

                {/* Trigger daily export */}
                <div className="bg-base-100 p-5 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-2">Save Daily Export</h3>
                    <p className="mb-3 text-sm opacity-75">Generate & store today's CSV on the server.</p>
                    <button
                        className="btn btn-warning w-full"
                        onClick={async () => {
                            try {
                                const token = localStorage.getItem('token');
                                const res = await fetch('http://localhost:4000/api/trigger-daily-export', {
                                    method: 'POST',
                                    headers: { Authorization: 'Bearer ' + token }
                                });

                                const out = await res.json();
                                if (out.ok) alert('Saved to server: ' + out.path);
                                else alert('Failed');
                            } catch (e) {
                                alert('Error saving export');
                            }
                        }}
                    >
                        Save Export to Server
                    </button>
                </div>
            </div>
        </div>
    );
}