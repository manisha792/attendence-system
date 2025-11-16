// frontend/src/components/StudentCard.jsx
import React from "react";

export default function StudentCard({ student, onRegister }) {
    return (
        <div className="bg-base-100 p-4 rounded-lg shadow-md border border-base-300 flex gap-4 items-center">
            {/* Photo */}
            <div className="w-20 h-20 rounded overflow-hidden bg-base-200 flex items-center justify-center">
                {student.photo_path ? (
                    <img
                        src={`http://localhost:4000/uploads/${student.photo_path}`}
                        alt="student"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-xs opacity-70">No Photo</span>
                )}
            </div>

            {/* Student Info */}
            <div className="flex-1">
                <h3 className="text-lg font-semibold">{student.name}</h3>
                <p className="text-sm opacity-70">{student.email}</p>
                <p className="text-sm opacity-70">Class: {student.class}</p>

                {/* Register Descriptor Button */}
                {onRegister && (
                    <button
                        className="btn btn-sm btn-primary mt-2"
                        onClick={() => onRegister(student)}
                    >
                        Register Descriptor
                    </button>
                )}
            </div>
        </div>
    );
}