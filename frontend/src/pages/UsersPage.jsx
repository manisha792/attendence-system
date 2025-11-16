// frontend/src/pages/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentCard from '../components/StudentCard';

export default function UsersPage() {
    const [klass, setKlass] = useState('class-A');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({}); // map studentId -> bool
    const [attendanceCache, setAttendanceCache] = useState({}); // studentId -> attendance[]

    useEffect(() => {
        loadStudents();
    }, []);

    async function loadStudents() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:4000/api/users/students?class=${encodeURIComponent(klass)}`, { headers: { Authorization: 'Bearer ' + token } });
            setStudents(res.data);
        } catch (e) { console.error(e); alert('Failed to load students'); }
        setLoading(false);
    }

    async function registerDescriptor(student) {
        try {
            const faceapi = await import('face-api.js');
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

            if (!student.photo_path) return alert('Student has no uploaded photo');
            const imgUrl = `http://localhost:4000/uploads/${student.photo_path}`;
            const img = await faceapi.fetchImage(imgUrl);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            if (!detection) return alert('No face detected in student photo');
            const descriptor = Array.from(detection.descriptor);
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:4000/api/register', { user_id: student.id, descriptors: [descriptor] }, { headers: { Authorization: 'Bearer ' + token } });
            alert('Descriptor registered for ' + student.name);
        } catch (e) { console.error(e); alert('Failed to register descriptor: ' + (e.message || e)); }
    }

    async function viewAttendance(student) {
        // toggle
        setExpanded(s => ({ ...s, [student.id]: !s[student.id] }));
        if (attendanceCache[student.id]) return; // already loaded

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:4000/api/users/${student.id}/attendance`, { headers: { Authorization: 'Bearer ' + token } });
            setAttendanceCache(c => ({ ...c, [student.id]: res.data }));
        } catch (e) { console.error(e); alert('Failed to load attendance'); }
    }

    async function editStudent(student) {
        const newName = prompt('New name', student.name);
        const newEmail = prompt('New email', student.email);
        const newClass = prompt('New class', student.class || 'class-A');
        if (!newName) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:4000/api/users/${student.id}`, { name: newName, email: newEmail, class: newClass }, { headers: { Authorization: 'Bearer ' + token } });
            alert('Updated');
            loadStudents();
        } catch (e) { console.error(e); alert('Failed to update student'); }
    }

    async function deleteStudent(student) {
        if (!window.confirm(`Delete ${student.name}? This is permanent.`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:4000/api/users/${student.id}`, { headers: { Authorization: 'Bearer ' + token } });
            alert('Deleted');
            loadStudents();
        } catch (e) { console.error(e); alert('Delete failed'); }
    }

    return (
        <div>
            <h2 className="text-xl mb-2">Students by Class</h2>
            <div className="flex gap-2 mb-4 items-center">
                <select value={klass} onChange={e => setKlass(e.target.value)} className="select">
                    <option value="class-A">class-A</option>
                    <option value="class-B">class-B</option>
                    <option value="class-C">class-C</option>
                </select>
                <button className="btn" onClick={loadStudents}>Load</button>
            </div>

            {loading && <div>Loading...</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(s => (
                    <div key={s.id} className="p-4 border rounded shadow-sm">
                        <div className="flex items-center gap-4">
                            {s.photo_path ? <img src={`http://localhost:4000/uploads/${s.photo_path}`} alt="photo" width={80} /> : <div className="w-20 h-20 bg-slate-100 flex items-center justify-center">No photo</div>}
                            <div className="flex-1">
                                <div className="font-medium">{s.name} <span className="text-xs opacity-60">({s.class})</span></div>
                                <div className="text-sm text-slate-500">{s.email}</div>
                                <div className="mt-2 flex gap-2">
                                    <button className="btn btn-sm" onClick={() => registerDescriptor(s)}>Register Descriptor</button>
                                    <button className="btn btn-sm btn-outline" onClick={() => viewAttendance(s)}>{expanded[s.id] ? 'Hide Attendance' : 'View Attendance'}</button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => editStudent(s)}>Edit</button>
                                    <button className="btn btn-sm btn-error" onClick={() => deleteStudent(s)}>Delete</button>
                                </div>

                                {expanded[s.id] && (
                                    <div className="mt-3 bg-base-100 p-3 rounded">
                                        <h4 className="font-medium mb-2">Attendance</h4>
                                        {(!attendanceCache[s.id] || attendanceCache[s.id].length === 0) && <div className="text-sm text-gray-500">No records</div>}
                                        {(attendanceCache[s.id] || []).map(a => (
                                            <div key={a.id} className="p-2 border-b">
                                                <div className="text-sm">{new Date(a.timestamp).toLocaleString()}</div>
                                                <div className="text-xs opacity-75">Note: {a.note || '—'}</div>
                                                <div className="text-xs opacity-75">Remark: {a.remark || '—'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
