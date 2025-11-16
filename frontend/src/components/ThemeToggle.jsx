// frontend/src/components/ThemeToggle.jsx
import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <label className="flex cursor-pointer items-center gap-2">
            <span className="text-sm font-medium">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
            <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={theme === 'dark'}
                onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            />
        </label>
    );
}