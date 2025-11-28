
import React, { useState, useEffect } from 'react';
import { AttendanceStatus } from '../../types';
import StatCard from '../common/StatCard';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';

const TeacherDashboard: React.FC = () => {
    const { students, assignedClass } = useData();
    const [todayAttendance, setTodayAttendance] = useState(0);

    useEffect(() => {
        if (assignedClass) {
            const today = new Date().toISOString().split('T')[0];
            api.getAttendance({ classId: assignedClass.id, date: today })
                .then(records => {
                    const presentCount = records.filter(r => r.status === AttendanceStatus.Present || r.status === AttendanceStatus.Late).length;
                    setTodayAttendance(presentCount);
                })
                .catch(err => console.error("Failed to fetch attendance", err));
        }
    }, [assignedClass]);

    if (!assignedClass) return <div>Loading class data...</div>;
    
    const studentsInClass = students.filter(s => s.classId === assignedClass.id);
    const attendancePercentage = studentsInClass.length > 0 ? Math.round((todayAttendance / studentsInClass.length) * 100) : 0;

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">My Dashboard ({assignedClass.name})</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Students" value={studentsInClass.length.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                <StatCard title="Today's Attendance" value={`${attendancePercentage}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
            </div>
        </div>
    );
};

export default TeacherDashboard;
