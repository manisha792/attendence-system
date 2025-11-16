import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AttendanceList() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState("class-A");

    async function loadAttendance() {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `http://localhost:4000/api/attendance?class=${encodeURIComponent(selectedClass)}`,
                { headers: { Authorization: "Bearer " + token } }
            );
            setRecords(res.data);
        } catch (e) {
            console.error(e);
            alert("Failed to load attendance");
        }
        setLoading(false);
    }

    useEffect(() => {
        loadAttendance();
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Attendance Records</h2>

            {/* Class Filter */}
            <div className="flex gap-4 items-center mb-4">
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="select select-bordered"
                >
                    <option value="class-A">class-A</option>
                    <option value="class-B">class-B</option>
                </select>

                <button className="btn" onClick={loadAttendance}>
                    Load Attendance
                </button>
            </div>

            {/* Loading */}
            {loading ? <p>Loading...</p> : null}

            {/* Attendance List */}
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Name</th>
                            <th>Timestamp</th>
                            <th>Note</th>
                            <th>Remark</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r) => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.name}</td>
                                <td>{r.timestamp}</td>
                                <td>{r.note || "—"}</td>
                                <td>{r.remark || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
