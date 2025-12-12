
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AttendanceStatus, AttendanceRecord } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Pagination from '../common/Pagination';
import Skeleton from '../common/Skeleton';

const AttendanceView: React.FC = () => {
    const { students, classes } = useData();
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getAttendance({
                page: currentPage,
                limit: 20, // Higher limit for attendance logs
                classId: selectedClassId !== 'all' ? selectedClassId : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });

            if (Array.isArray(data)) {
                 setAttendanceRecords(data);
                 setTotalPages(1);
            } else {
                 setAttendanceRecords(data.data);
                 setTotalPages(data.last_page);
            }
        } catch (err) {
            console.error("Failed to fetch attendance records", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedClassId, startDate, endDate]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

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
                             {loading ? (
                                 Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="p-2"><Skeleton className="h-4 w-24"/></td>
                                        <td className="p-2"><Skeleton className="h-4 w-32"/></td>
                                        <td className="p-2"><Skeleton className="h-4 w-16"/></td>
                                        <td className="p-2"><Skeleton className="h-4 w-20"/></td>
                                    </tr>
                                ))
                            ) : attendanceRecords.length === 0 ? (
                                <tr><td colSpan={4} className="text-center p-8 text-slate-500">No attendance records found for the selected criteria.</td></tr>
                            ) : (
                                attendanceRecords.map(record => (
                                    <tr key={record.id} className="border-b">
                                        <td className="p-2">{record.date}</td>
                                        <td className="p-2">{studentMap.get(record.studentId) || 'Unknown'}</td>
                                        <td className="p-2">{classes.find(c => c.id === record.classId)?.name || 'N/A'}</td>
                                        <td className="p-2">
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                record.status === AttendanceStatus.Absent ? 'bg-red-100 text-red-800' : 
                                                record.status === AttendanceStatus.Late ? 'bg-yellow-100 text-yellow-800' : 
                                                record.status === AttendanceStatus.Present ? 'bg-green-100 text-green-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>{record.status}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default AttendanceView;
