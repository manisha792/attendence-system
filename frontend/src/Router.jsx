// frontend/src/Router.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import UsersPage from './pages/UsersPage';
import AttendanceList from './pages/AttendanceList';
import LiveScanner from './pages/LiveScanner';

function PrivateRoute({ children, role }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" />;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (role && payload.role !== role) return <Navigate to="/login" />;
        return children;
    } catch {
        return <Navigate to="/login" />;
    }
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/student" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />

                <Route path="/teacher" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />

                <Route path="/teacher/users" element={<PrivateRoute role="teacher"><UsersPage /></PrivateRoute>} />

                <Route path="/teacher/attendance" element={<PrivateRoute role="teacher"><AttendanceList /></PrivateRoute>} />

                <Route path="/teacher/scan" element={<PrivateRoute role="teacher"><LiveScanner /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
    );
}
