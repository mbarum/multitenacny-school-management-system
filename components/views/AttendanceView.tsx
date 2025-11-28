
import React, { useState, useMemo } from 'react';
import { AttendanceStatus } from '../../types';
import { useData } from '../../contexts/DataContext';

const AttendanceView: React.FC = () => {
    const { attendanceRecords, students, classes } = useData();
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

    const filteredRecords = useMemo(() => {
        return attendanceRecords.filter(r => {
            if (r.status === AttendanceStatus.Present) return false; // Only show issues
            if (selectedClassId !== 'all' && r.classId !== selectedClassId) return false;
            const recordDate = new Date(r.date);
            if (startDate && recordDate < new Date(startDate)) return false;
            if (endDate && recordDate > new Date(endDate)) return false;
            return true;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendanceRecords, selectedClassId, startDate, endDate]);

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Attendance Overview</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border border-slate-300 rounded-lg">
                        <option value="all">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg" />
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="bg-slate-50 border-b">
                                <th className="p-2 font-medium">Date</th>
                                <th className="p-2 font-medium">Student</th>
                                <th className="p-2 font-medium">Class</th>
                                <th className="p-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map(record => (
                                <tr key={record.id} className="border-b">
                                    <td className="p-2">{record.date}</td>
                                    <td className="p-2">{studentMap.get(record.studentId) || 'Unknown'}</td>
                                    {/* Fix: Added a fallback value to prevent rendering 'undefined' if the class is not found. */}
                                    <td className="p-2">{classes.find(c => c.id === record.classId)?.name || 'N/A'}</td>
                                    <td className="p-2">
                                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            record.status === AttendanceStatus.Absent ? 'bg-red-100 text-red-800' : 
                                            record.status === AttendanceStatus.Late ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'
                                        }`}>{record.status}</span>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr><td colSpan={4} className="text-center p-8 text-slate-500">No attendance issues found for the selected criteria.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceView;
