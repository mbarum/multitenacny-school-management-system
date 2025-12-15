
import React, { useState, useMemo } from 'react';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import { useQuery } from '@tanstack/react-query';

const AttendanceView: React.FC = () => {
    // We only need classes from context to populate the filter dropdown
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['attendance', selectedClassId, startDate, endDate, currentPage],
        queryFn: () => api.getAttendance({
            page: currentPage,
            limit: 20,
            classId: selectedClassId !== 'all' ? selectedClassId : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        }),
        placeholderData: (prev) => prev
    });

    const attendanceRecords = attendanceData ? (Array.isArray(attendanceData) ? attendanceData : attendanceData.data) : [];
    const totalPages = attendanceData && !Array.isArray(attendanceData) ? attendanceData.last_page : 1;

    // Filter out 'Present' records client-side if the API doesn't support filtering them (optional based on requirement)
    // Here we show all returned by API, assuming API can be updated to filter if needed. 
    // The previous implementation filtered in memory.
    const displayRecords = attendanceRecords.filter((r: AttendanceRecord) => r.status !== AttendanceStatus.Present);

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Attendance Overview</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border border-slate-300 rounded-lg">
                        <option value="all">All Classes</option>
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg" />
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
                            {displayRecords.length > 0 ? (
                                displayRecords.map((record: any) => (
                                    <tr key={record.id} className="border-b">
                                        <td className="p-2">{record.date}</td>
                                        {/* Use record.student.name if available from backend relation, fallback to ID */}
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
                                <tr><td colSpan={4} className="text-center p-8 text-slate-500">No attendance issues found for the selected criteria.</td></tr>
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
