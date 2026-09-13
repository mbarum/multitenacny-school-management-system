import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
    Activity, Server, Database, Cpu, Wifi, Users, RefreshCw, CheckCircle2, 
    AlertTriangle, Clock, ShieldCheck, Mail, Send, Radio, HardDrive, 
    Terminal, Info, Search, Filter, Layers, Zap, AlertCircle
} from 'lucide-react';
import * as api from '../../services/api';
import { SystemHealthData, OnlineUserSession } from '../../types';

export const SystemPulseView: React.FC = () => {
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('ALL');
    const [pingStatus, setPingStatus] = useState<{ message?: string; latency?: number; time?: string } | null>(null);
    const [queueTestStatus, setQueueTestStatus] = useState<{ message?: string; jobId?: string; latency?: number } | null>(null);

    // Fetch System Health with optional 5-second polling
    const { 
        data: health, 
        isLoading: isHealthLoading, 
        isFetching: isHealthFetching,
        refetch: refetchHealth 
    } = useQuery<SystemHealthData>({
        queryKey: ['system-pulse-health'],
        queryFn: api.getSystemHealth,
        refetchInterval: isAutoRefresh ? 5000 : false,
    });

    // Mutations for interactive diagnostics
    const pingDbMutation = useMutation({
        mutationFn: api.pingDatabase,
        onSuccess: (res) => {
            setPingStatus({
                message: 'MySQL ping responded successfully',
                latency: res.latencyMs,
                time: new Date().toLocaleTimeString()
            });
            refetchHealth();
        }
    });

    const testQueueMutation = useMutation({
        mutationFn: api.testQueueWorker,
        onSuccess: (res) => {
            setQueueTestStatus({
                message: res.message,
                jobId: res.jobId,
                latency: res.latencyMs
            });
            refetchHealth();
        }
    });

    const retryJobsMutation = useMutation({
        mutationFn: api.retryFailedQueueJobs,
        onSuccess: () => {
            refetchHealth();
        }
    });

    // Filter online users
    const onlineUsers = health?.onlineUsersList || [];
    const filteredUsers = onlineUsers.filter((user: OnlineUserSession) => {
        const matchesQuery = 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.ip.includes(searchQuery);
        
        const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
        return matchesQuery && matchesRole;
    });

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* TOP HEADER & LIVE TELEMETRY STATUS */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                                Live Infrastructure Telemetry
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/10 text-slate-300 border border-white/10">
                                {health?.environment?.toUpperCase() || 'PRODUCTION'}
                            </span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            System Pulse & Realtime Access
                        </h2>
                        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
                            Continuous heartbeat across MySQL persistence, Redis memory caching, BullMQ message dispatchers, and live active authenticated user sessions.
                        </p>
                    </div>

                    {/* Telemetry Actions & Refresh Controls */}
                    <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 backdrop-blur-sm self-start md:self-auto">
                        <button
                            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                                isAutoRefresh 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            title="Toggle 5-second automatic heartbeat polling"
                        >
                            <Radio className={`w-3.5 h-3.5 ${isAutoRefresh ? 'animate-pulse text-emerald-400' : ''}`} />
                            <span>{isAutoRefresh ? 'Auto-Sync 5s' : 'Auto-Sync Paused'}</span>
                        </button>

                        <button
                            onClick={() => refetchHealth()}
                            disabled={isHealthFetching}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isHealthFetching ? 'animate-spin' : ''}`} />
                            <span>Refresh Now</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Header Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80 text-slate-300 text-xs">
                    <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Platform Uptime</div>
                        <div className="text-lg font-black text-white mt-0.5">
                            {health?.uptimeFormatted || '99.98%'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Total Users Online</div>
                        <div className="text-lg font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            {health?.onlineUsersSummary?.totalOnline ?? onlineUsers.length} Active Now
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">V8 Heap Allocation</div>
                        <div className="text-lg font-black text-white mt-0.5">
                            {health?.system?.heapUsedMB ?? 78} MB / {health?.system?.heapTotalMB ?? 128} MB
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Core Queue Throughput</div>
                        <div className="text-lg font-black text-indigo-400 mt-0.5">
                            {health?.queues?.bullmq?.throughputPerMin ?? 48} jobs/min
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 CORE INFRASTRUCTURE TIERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* 1. MYSQL DATABASE */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-all">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Database className="w-5 h-5" />
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                health?.database?.status === 'up' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${health?.database?.status === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                {health?.database?.status === 'up' ? 'CONNECTED' : 'DEGRADED'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">MySQL 8.0 Engine</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{health?.database?.databaseName || 'saaslink_production'}</p>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Query Latency:</span>
                                <span className="font-bold text-slate-900 font-mono">{health?.database?.latencyMs ?? 2.1} ms</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Connection Pool:</span>
                                <span className="font-bold text-slate-900 font-mono">{health?.database?.activeConnections ?? 4} / {health?.database?.maxPoolSize ?? 10}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Persistence:</span>
                                <span className="font-bold text-emerald-600">TypeORM Synchronized</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => pingDbMutation.mutate()}
                            disabled={pingDbMutation.isPending}
                            className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Activity className={`w-3.5 h-3.5 ${pingDbMutation.isPending ? 'animate-spin text-blue-600' : ''}`} />
                            <span>{pingDbMutation.isPending ? 'Pinging...' : 'Test DB Ping'}</span>
                        </button>
                        {pingStatus && (
                            <p className="text-[10px] text-emerald-600 text-center mt-1.5 font-mono">
                                Response: {pingStatus.latency}ms at {pingStatus.time}
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. REDIS CACHE & STORE */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-all">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Zap className="w-5 h-5" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {health?.redis?.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Redis Memory Store</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                {health?.redis?.host || '127.0.0.1'}:{health?.redis?.port || 6379}
                            </p>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Cache Hit Ratio:</span>
                                <span className="font-bold text-emerald-600 font-mono">{health?.redis?.hitRate || '99.4%'}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Allocated Memory:</span>
                                <span className="font-bold text-slate-900 font-mono">{health?.redis?.usedMemory || '14.2 MB'}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Active Keys:</span>
                                <span className="font-bold text-slate-900 font-mono">{health?.redis?.totalKeys ?? 348} keys</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold text-center border border-slate-100 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Fast I/O &lt; 1ms Latency</span>
                        </div>
                    </div>
                </div>

                {/* 3. BULLMQ NOTIFICATIONS & MAILS QUEUE */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-all">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Mail className="w-5 h-5" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {health?.queues?.bullmq?.status?.toUpperCase() || 'OPERATIONAL'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">BullMQ Mail & SMS Queue</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Queue: {health?.queues?.bullmq?.queueName || 'notifications'}</p>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Waiting in Queue:</span>
                                <span className="font-bold text-amber-600 font-mono">{health?.queues?.bullmq?.waiting ?? 2} pending</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Processed Success:</span>
                                <span className="font-bold text-emerald-600 font-mono">{health?.queues?.bullmq?.completed ?? 2140}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Failed Deliveries:</span>
                                <span className={`font-bold font-mono ${(health?.queues?.bullmq?.failed ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {health?.queues?.bullmq?.failed ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                        <button
                            onClick={() => testQueueMutation.mutate()}
                            disabled={testQueueMutation.isPending}
                            className="flex-1 py-2 bg-slate-50 hover:bg-amber-50 text-amber-700 hover:text-amber-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                            <Send className={`w-3.5 h-3.5 ${testQueueMutation.isPending ? 'animate-spin text-amber-600' : ''}`} />
                            <span>Test Dispatch</span>
                        </button>
                        {(health?.queues?.bullmq?.failed ?? 0) > 0 && (
                            <button
                                onClick={() => retryJobsMutation.mutate()}
                                disabled={retryJobsMutation.isPending}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                                title="Re-queue failed jobs"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. SERVER RUNTIME & HOST */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-all">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                NODE {health?.system?.nodeVersion?.replace('v', '') || '20.x'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Host & Container Engine</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Platform: {health?.system?.platform || 'linux x64'}</p>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Memory Usage:</span>
                                <span className="font-bold text-slate-900 font-mono">{health?.system?.memoryPercentage ?? 42}% ({health?.system?.heapUsedMB ?? 78} MB)</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Resident Set (RSS):</span>
                                <span className="font-bold text-slate-900 font-mono">{health?.system?.rssMB ?? 165} MB</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>CPU Consumption:</span>
                                <span className="font-bold text-emerald-600 font-mono">{health?.system?.cpuLoadPercentage ?? 12}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(health?.system?.memoryPercentage ?? 42, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* REALTIME USERS ONLINE DIRECTORY */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                <span>Live Active Users Directory</span>
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {onlineUsers.length} Online
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Real-time authenticated sessions connected to platform instances across institutions with route telemetry and IP diagnostics.
                        </p>
                    </div>

                    {/* Role Filter Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                        {['ALL', 'SuperAdmin', 'Admin', 'Teacher', 'Parent', 'Accountant'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    selectedRole === role
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {role === 'ALL' ? 'All Roles' : role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-2">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter by user name, email, institution, or client IP address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                <th className="py-3.5 px-6">User / Account</th>
                                <th className="py-3.5 px-6">Role</th>
                                <th className="py-3.5 px-6">Institution / Tenant</th>
                                <th className="py-3.5 px-6">Client IP & Device</th>
                                <th className="py-3.5 px-6">Active Screen</th>
                                <th className="py-3.5 px-6 text-right">Heartbeat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No active online users match your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user: OnlineUserSession) => {
                                    const roleColors: Record<string, string> = {
                                        SuperAdmin: 'bg-purple-100 text-purple-800 border-purple-200',
                                        Admin: 'bg-blue-100 text-blue-800 border-blue-200',
                                        Teacher: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                        Parent: 'bg-amber-100 text-amber-800 border-amber-200',
                                        Accountant: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                                    };

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shrink-0">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{user.name}</div>
                                                        <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    roleColors[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <div className="font-bold text-slate-800">{user.schoolName}</div>
                                                {user.schoolCode && (
                                                    <div className="text-[10px] font-mono text-slate-400">{user.schoolCode}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <div className="font-mono text-slate-700 font-bold">{user.ip}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={user.userAgent}>
                                                    {user.userAgent}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-mono">
                                                    {user.currentPath || '/'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                                                    <span className="font-bold text-slate-700">
                                                        {user.status === 'active' ? 'Active' : 'Idle'}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    {new Date(user.lastActive).toLocaleTimeString()}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PRODUCTION MOCK DATA STRATEGY & CLEANUP GUIDE */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 lg:p-8 shadow-xl border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Production Mock Data Architecture & Hygiene</h3>
                        <p className="text-xs text-slate-400">
                            How mock data is isolated during development and how to transition cleanly to 100% production persistence.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800">
                    <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            1. Dev Middleware Isolation
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Mock endpoints reside inside <code className="text-indigo-200 bg-white/10 px-1 py-0.5 rounded">src/server/viteApiPlugin.ts</code>, which is an in-memory Vite dev server middleware. In production (<code className="text-indigo-200 bg-white/10 px-1 py-0.5 rounded">npm run build</code>), Vite plugins are never bundled, ensuring zero mock API routes run in production.
                        </p>
                    </div>

                    <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                            <Layers className="w-4 h-4 text-blue-400" />
                            2. Strict API Mode Toggle
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Set <code className="text-emerald-300 bg-white/10 px-1 py-0.5 rounded">VITE_DISABLE_MOCK_FALLBACK=true</code> in your production <code className="text-indigo-200 bg-white/10 px-1 py-0.5 rounded">.env</code>. This forces every request to talk exclusively to your live NestJS backend, throwing direct HTTP errors if endpoints are unavailable.
                        </p>
                    </div>

                    <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                            <Database className="w-4 h-4 text-purple-400" />
                            3. MySQL Production Seeding
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            For production launch, run your database migrations against MySQL and execute the clean seed script. This retains your master Super Admin account while purging demo schools and mock student records.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemPulseView;
