
import React, { useState, useEffect } from 'react';
import type { AttendanceRecord, Student } from '../../types';
import { AttendanceStatus } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const TeacherAttendanceView: React.FC = () => {
    const { updateAttendance, assignedClass, isLoading } = useData();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyRecords, setDailyRecords] = useState<Map<string, AttendanceStatus>>(new Map());
    
    // Fetch Data
    const { data: students = [] } = useQuery({
        queryKey: ['my-class-students', assignedClass?.id],
        queryFn: () => assignedClass 
            ? api.getStudents({ classId: assignedClass.id, status: 'Active', pagination: 'false' }).then(res => Array.isArray(res) ? res : res.data)
            : Promise.resolve([]),
        enabled: !!assignedClass
    });

    const { data: existingRecords = [], refetch: refetchAttendance } = useQuery({
        queryKey: ['attendance', assignedClass?.id, selectedDate],
        queryFn: () => assignedClass 
            ? api.getAttendance({ classId: assignedClass.id, date: selectedDate }).then(res => Array.isArray(res) ? res : res.data)
            : Promise.resolve([]),
        enabled: !!assignedClass
    });

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    if (!assignedClass) {
        return (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow m-8">
                <h3 className="text-xl font-bold mb-2">No Class Assigned</h3>
                <p>You need to be assigned to a class to mark attendance.</p>
            </div>
        );
    }

    // Sync state with fetched data
    useEffect(() => {
         const newDailyRecords = new Map<string, AttendanceStatus>();
         students.forEach((student: Student) => {
            const existingRecord = existingRecords.find((r: AttendanceRecord) => r.studentId === student.id);
            newDailyRecords.set(student.id, existingRecord ? existingRecord.status : AttendanceStatus.Present);
         });
         setDailyRecords(newDailyRecords);
    }, [students, existingRecords]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setDailyRecords(prev => new Map(prev).set(studentId, status));
    };

    const handleSaveAttendance = () => {
        const updatedRecords: AttendanceRecord[] = [];
        
        dailyRecords.forEach((status, studentId) => {
            const existingRecord = existingRecords.find((r: any) => r.studentId === studentId);
            const record: AttendanceRecord = {
                id: existingRecord ? existingRecord.id : `att-${studentId}-${selectedDate}`, // ID might be temporary if new
                studentId,
                classId: assignedClass.id,
                date: selectedDate,
                status,
            };
            updatedRecords.push(record);
        });

        updateAttendance(updatedRecords).then(() => {
            alert(`Attendance for ${selectedDate} saved successfully.`);
            refetchAttendance();
        });
    };

    // Calculate Summary
    const summary = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    dailyRecords.forEach(status => {
        summary[status]++;
    });

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Take Attendance</h2>
                    <p className="text-slate-600">Class: <span className="font-semibold text-primary-700">{assignedClass.name}</span></p>
                </div>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)}
                        className="p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button 
                        onClick={handleSaveAttendance} 
                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors"
                    >
                        Save Attendance
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                <div className="bg-green-100 p-4 rounded-lg"><div className="text-2xl font-bold text-green-800">{summary.Present}</div><div className="text-green-700">Present</div></div>
                <div className="bg-red-100 p-4 rounded-lg"><div className="text-2xl font-bold text-red-800">{summary.Absent}</div><div className="text-red-700">Absent</div></div>
                <div className="bg-yellow-100 p-4 rounded-lg"><div className="text-2xl font-bold text-yellow-800">{summary.Late}</div><div className="text-yellow-700">Late</div></div>
                <div className="bg-slate-100 p-4 rounded-lg"><div className="text-2xl font-bold text-slate-800">{summary.Excused}</div><div className="text-slate-700">Excused</div></div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                 <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student: any) => (
                            <tr key={student.id} className="border-b border-slate-100">
                                <td className="px-4 py-2 font-medium text-slate-800">{student.name}</td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-center space-x-2">
                                        {Object.values(AttendanceStatus).map(status => (
                                            <button 
                                                key={status} 
                                                onClick={() => handleStatusChange(student.id, status)}
                                                className={`px-3 py-1 text-sm rounded-full transition-all ${
                                                    dailyRecords.get(student.id) === status 
                                                    ? 'text-white shadow-md ' + (status === 'Present' ? 'bg-green-500' : status === 'Absent' ? 'bg-red-500' : status === 'Late' ? 'bg-yellow-500' : 'bg-slate-500')
                                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherAttendanceView;
