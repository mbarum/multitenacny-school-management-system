
import React, { useState, useEffect } from 'react';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import { useQuery } from '@tanstack/react-query';

const AttendanceView: React.FC = () => {
    // We only need classes from context to populate the filter dropdown
    // Fix: Added explicit (res: any) type to then callback to resolve type inference issues.
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data) });
    
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(''); // Default show all
    const [currentPage, setCurrentPage] = useState(1);

    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['attendance', selectedClassId, startDate, endDate, statusFilter, currentPage],
        queryFn: () => api.getAttendance({
            page: currentPage,
            limit: 20,
            classId: selectedClassId !== 'all' ? selectedClassId : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            status: statusFilter || undefined
        }),
        placeholderData: (prev) => prev
    });

    const attendanceRecords = attendanceData ? (Array.isArray(attendanceData) ? attendanceData : attendanceData.data) : [];
    const totalPages = attendanceData && !Array.isArray(attendanceData) ? attendanceData.last_page : 1;

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Attendance Overview</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border border-slate-300 rounded-lg">
                        <option value="all">All Classes</option>
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border border-slate-300 rounded-lg">
                        <option value="">Status: All</option>
                        <option value={AttendanceStatus.Present}>Present</option>
                        <option value={AttendanceStatus.Absent}>Absent</option>
                        <option value={AttendanceStatus.Late}>Late</option>
                        <option value={AttendanceStatus.Excused}>Excused</option>
                    </select>

                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg" placeholder="Start Date" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg" placeholder="End Date" />
                </div>
                 <div className="overflow-x-auto">
                    {isLoading ? (
                         <div className="space-y-4">
                             {[1,2,3].map(i => (
                                 <div key={i} className="flex space-x-4">
                                     <Skeleton className="h-6 w-32" />
                                     <Skeleton className="h-6 w-48" />
                                     <Skeleton className="h-6 w-24" />
                                 </div>
                             ))}
                         </div>
                    ) : (
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
                            {attendanceRecords.length > 0 ? (
                                attendanceRecords.map((record: any) => (
                                    <tr key={record.id} className="border-b">
                                        <td className="p-2">{record.date}</td>
                                        <td className="p-2">{record.student?.name || 'Unknown Student'}</td>
                                        <td className="p-2">{classes.find((c: any) => c.id === record.classId)?.name || 'N/A'}</td>
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
                            ) : (
                                <tr><td colSpan={4} className="text-center p-8 text-slate-500">No attendance records found for the selected criteria.</td></tr>
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default AttendanceView;
