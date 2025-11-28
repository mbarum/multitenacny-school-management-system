

import React, { useState, useEffect, useMemo } from 'react';
import type { AttendanceRecord } from '../../types';
import { AttendanceStatus } from '../../types';
import { useData } from '../../contexts/DataContext';

const TeacherAttendanceView: React.FC = () => {
    const { students, attendanceRecords, updateAttendance, assignedClass } = useData();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyRecords, setDailyRecords] = useState<Map<string, AttendanceStatus>>(new Map());

    if (!assignedClass) return <div>No class assigned.</div>;

    const studentsInClass = useMemo(() => students.filter(s => s.classId === assignedClass.id), [students, assignedClass]);

    useEffect(() => {
        const recordsForDate = attendanceRecords.filter(r => r.date === selectedDate && r.classId === assignedClass.id);
        const newDailyRecords = new Map<string, AttendanceStatus>();
        studentsInClass.forEach(student => {
            const existingRecord = recordsForDate.find(r => r.studentId === student.id);
            newDailyRecords.set(student.id, existingRecord ? existingRecord.status : AttendanceStatus.Present);
        });
        setDailyRecords(newDailyRecords);
    }, [selectedDate, attendanceRecords, studentsInClass, assignedClass.id]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setDailyRecords(prev => new Map(prev).set(studentId, status));
    };

    const handleSaveAttendance = () => {
        const updatedRecords = [...attendanceRecords.filter(r => r.date !== selectedDate || r.classId !== assignedClass.id)];
        
        dailyRecords.forEach((status, studentId) => {
            const existingRecord = attendanceRecords.find(r => r.date === selectedDate && r.studentId === studentId);
            const record: AttendanceRecord = {
                id: existingRecord ? existingRecord.id : `att-${studentId}-${selectedDate}`,
                studentId,
                classId: assignedClass.id,
                date: selectedDate,
                status,
            };
            updatedRecords.push(record);
        });

        updateAttendance(updatedRecords).then(() => {
            alert(`Attendance for ${selectedDate} saved successfully.`);
        });
    };

    const summary = useMemo(() => {
        const counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
        dailyRecords.forEach(status => {
            counts[status]++;
        });
        return counts;
    }, [dailyRecords]);

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Take Attendance</h2>
                    <p className="text-slate-600">Class: {assignedClass.name}</p>
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
                        {studentsInClass.map(student => (
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