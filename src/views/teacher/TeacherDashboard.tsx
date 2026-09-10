
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AttendanceStatus } from '../../types';
import StatCard from '../../components/common/StatCard';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';

const TeacherDashboard: React.FC = () => {
    const { assignedClass, setActiveView } = useData();

    const { data: students = [], isLoading: studentsLoading } = useQuery({
        queryKey: ['my-class-students', assignedClass?.id],
        queryFn: () => assignedClass 
            ? api.getStudents({ classId: assignedClass.id, pagination: 'false', status: 'Active' }).then(res => Array.isArray(res) ? res : res.data)
            : Promise.resolve([]),
        enabled: !!assignedClass
    });

    const { data: attendance = [] } = useQuery({
        queryKey: ['daily-attendance', assignedClass?.id],
        queryFn: () => assignedClass 
            ? api.getAttendance({ classId: assignedClass.id, date: new Date().toISOString().split('T')[0] }).then(res => Array.isArray(res) ? res : res.data)
            : Promise.resolve([]),
        enabled: !!assignedClass
    });

    if (!assignedClass) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                <div className="bg-yellow-50 p-6 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Class Assigned</h2>
                <p className="text-slate-600 max-w-md">You have not been assigned as a Form Teacher yet.</p>
            </div>
        );
    }
    
    const presentToday = attendance.filter((r: any) => r.status === AttendanceStatus.Present || r.status === AttendanceStatus.Late).length;
    const attendancePercentage = students.length > 0 ? Math.round((presentToday / students.length) * 100) : 0;

    return (
        <div className="p-6 md:p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Teacher Dashboard</h2>
                <p className="text-slate-500 mt-1">Managing Class: <span className="font-semibold text-primary-700">{assignedClass.name}</span></p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Students" 
                    value={studentsLoading ? "..." : students.length.toString()} 
                    loading={studentsLoading}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                    onClick={() => setActiveView('my_class')}
                />
                <StatCard 
                    title="Today's Attendance" 
                    value={`${attendancePercentage}%`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} 
                    onClick={() => setActiveView('teacher_attendance')}
                />
            </div>
        </div>
    );
};

export default TeacherDashboard;
