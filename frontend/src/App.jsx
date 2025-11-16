import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ThemeToggle from './components/ThemeToggle';

export default function App(){
  const [user,setUser] = useState(null);
  useEffect(()=>{
    const t = localStorage.getItem('token');
    if (t) {
      try { const payload = JSON.parse(atob(t.split('.')[1])); setUser(payload); } catch(e){}
    }
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },[]);

  if (!user) return (<div className="p-6"><ThemeToggle /><h2 className="text-2xl mb-4">Welcome</h2><Login setUser={setUser} /><Register /></div>);
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4"><h1 className="text-2xl">Face Attendance</h1><ThemeToggle /></div>
      {user.role === 'student' ? <StudentDashboard user={user} /> : <TeacherDashboard user={user} />}
    </div>
  );
}