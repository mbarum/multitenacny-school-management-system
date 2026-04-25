import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Building, 
  Wallet, 
  Bell, 
  GraduationCap, 
  ArrowRight, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  XCircle,
  BarChart3,
  Globe,
  Settings,
  Plus,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const StatCard = ({ icon, label, value, color, tooltip }: { icon: React.ReactNode, label: string, value: string | number, color: string, tooltip?: string }) => {
  return (
    <motion.div
      className="bg-white p-6 border border-gray-200 flex items-center space-x-3 group relative cursor-help"
      whileHover={{ y: -2 }}
    >
      <div className="p-2 bg-gray-50 border border-gray-100 text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-[9px] font-mono font-bold uppercase tracking-widest truncate">{label}</p>
        <p className="text-xl font-serif italic text-gray-900 mt-1 truncate">{value}</p>
      </div>
      {tooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
    </motion.div>
  );
};

const COLORS = ['#111827', '#4b5563', '#9ca3af', '#6b7280', '#374151', '#d1d5db'];

const SuperAdminPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'financials' | 'settings'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', domain: '', plan: 'standard', email: '', subscriptionFee: '' });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, tenantsRes] = await Promise.all([
        api.get('/super-admin/analytics').catch(e => {
          console.error('Failed to fetch analytics:', e);
          return { data: { 
            totalTenants: 0, 
            activeSubscriptions: 0, 
            pendingApprovals: 0, 
            totalRevenue: 0,
            totalStudents: 0,
            averageAttendance: 0,
            recentPayments: [],
            revenueOverTime: [],
            tenantsByPlan: []
          }};
        }),
        api.get('/super-admin/tenants').catch(e => {
          console.error('Failed to fetch tenants:', e);
          return { data: [] };
        })
      ]);
      
      const analyticsData = analyticsRes.data || {};
      setAnalytics({
        totalTenants: analyticsData.totalTenants ?? 0,
        activeSubscriptions: analyticsData.activeSubscriptions ?? 0,
        pendingApprovals: analyticsData.pendingApprovals ?? 0,
        totalRevenue: analyticsData.totalRevenue ?? 0,
        totalStudents: analyticsData.totalStudents ?? 0,
        averageAttendance: analyticsData.averageAttendance ?? 0,
        recentPayments: analyticsData.recentPayments || [],
        revenueOverTime: analyticsData.revenueOverTime || [],
        tenantsByPlan: analyticsData.tenantsByPlan || []
      });
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
    } catch (error) {
      console.error('Unexpected error in SuperAdmin data fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolling(true);
    try {
      await api.post('/super-admin/tenants', newTenant);
      await fetchData();
      setShowEnrollModal(false);
      setNewTenant({ name: '', domain: '', plan: 'standard', email: '', subscriptionFee: '' });
      toast.success('School enrolled successfully!');
    } catch (error) {
       console.error('Failed to enroll tenant:', error);
       toast.error('Failed to enroll school. Name or domain might already exist.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUpdatePlan = async (tenantId: string, plan: string) => {
    setUpdatingPlan(true);
    try {
      await api.patch(`/super-admin/tenants/${tenantId}/plan`, { plan });
      await fetchData();
      setShowPlanModal(false);
      setSelectedTenant(null);
      toast.success(`Subscription updated to ${plan} successfully.`);
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error('Failed to update subscription.');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/super-admin/tenants/${tenantId}/status`, { status: newStatus });
      await fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-brand-sand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-brand-white/40 mt-6 font-bold uppercase tracking-widest text-xs">Synchronizing Mission Control</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Internal Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-sm border border-gray-200 mb-10 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
          { id: 'schools', label: 'Institutions', icon: <Building size={14} /> },
          { id: 'financials', label: 'Fiscal Ledger', icon: <Wallet size={14} /> },
          { id: 'settings', label: 'Logic Config', icon: <Settings size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center space-x-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-gray-900 text-white shadow-xl' 
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Header Context */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-gray-400 uppercase tracking-widest text-[9px] font-mono font-bold mb-3">
            <Globe size={12} className="text-emerald-500" />
            <span>Platform_Global_Node_001</span>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tight text-gray-900 leading-none">
            {activeTab === 'overview' && 'System Analytics'}
            {activeTab === 'schools' && 'Managed Schools'}
            {activeTab === 'financials' && 'Revenue Vectors'}
            {activeTab === 'settings' && 'Platform Logic'}
          </h1>
          <p className="text-gray-500 mt-4 font-sans text-sm max-w-xl leading-relaxed">
            {activeTab === 'overview' && 'Comprehensive real-time instrumentation across all provisioned platform nodes and educational clusters.'}
            {activeTab === 'schools' && 'Direct management and state control for all high-value educational institutions within the SaaSLink network.'}
            {activeTab === 'financials' && 'Centralized ledger for all subscription revenue, manual bank reconciliation, and fiscal health tracking.'}
            {activeTab === 'settings' && 'Critical platform parameters, gateway logic, and ecosystem configuration for the entire EMIS network.'}
          </p>
        </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-white border border-gray-200 rounded-sm text-[10px] uppercase font-bold tracking-widest hover:bg-gray-50 transition-all active:scale-95"
              >
                Sync_Stream
              </button>
              {activeTab === 'schools' && (
                <button 
                  onClick={() => setShowEnrollModal(true)}
                  className="px-5 py-2 bg-gray-900 text-white rounded-sm text-[10px] uppercase font-bold tracking-widest flex items-center shadow-lg active:scale-95"
                >
                  <Plus size={14} className="mr-2" />
                  Enroll_Entity
                </button>
              )}
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && analytics && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
                  <StatCard icon={<Building size={20} />} label="Total Schools" value={analytics.totalTenants} color="blue" tooltip="Total schools provisioned on the platform" />
                  <StatCard icon={<CheckCircle size={20} />} label="Active Subs" value={analytics.activeSubscriptions} color="green" tooltip="Schools with currently active and paid subscriptions" />
                  <StatCard icon={<GraduationCap size={20} />} label="Student Base" value={analytics.totalStudents} color="purple" tooltip="Cumulative students across all managed institutions" />
                  <StatCard icon={<ArrowRight size={20} />} label="Attendance" value={`${analytics.averageAttendance}%`} color="indigo" tooltip="Real-time average student attendance across the network" />
                  <StatCard icon={<Wallet size={20} />} label="Gross Revenue" value={`KES ${(analytics.totalRevenue || 0).toLocaleString()}`} color="emerald" tooltip="Total system-wide revenue from all payment vectors" />
                  <StatCard icon={<Bell size={20} />} label="Approvals" value={analytics.pendingApprovals} color="yellow" tooltip="Manual bank/M-Pesa confirmations awaiting action" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 p-10 rounded-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-serif italic text-gray-900">Growth & Fiscal Inflow</h3>
                      <div className="flex items-center space-x-1 text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-gray-900 border border-white shadow-[0_0_8px_rgba(0,0,0,0.1)]"></span>
                        <span>Monthly_Kes</span>
                      </div>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.revenueOverTime}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#111827" stopOpacity={0.05}/>
                              <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="month" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fontStyle: 'italic' }} />
                          <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} tick={{ fontSize: 9, fontWeight: 700, fontStyle: 'italic' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ stroke: '#111827', strokeWidth: 1 }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" dot={{ fill: '#111827', r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Market Share */}
                  <div className="bg-white border border-gray-200 p-10 rounded-sm">
                    <h3 className="text-lg font-serif italic text-gray-900 mb-8 text-center">Plan Distribution</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.tenantsByPlan}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {analytics.tenantsByPlan.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent Payments Preview */}
                <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden mb-12 shadow-sm">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold tracking-tight text-gray-900">Financial Stream</h3>
                    <button onClick={() => setActiveTab('financials')} className="text-xs font-bold text-brand-green uppercase tracking-widest flex items-center hover:opacity-80 transition-opacity">
                      Operational Ledger <ArrowRight size={14} className="ml-2" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                          <th className="px-8 py-4">Institution</th>
                          <th className="px-8 py-4">Volume (KES)</th>
                          <th className="px-8 py-4">Gateway</th>
                          <th className="px-8 py-4">Timestamp</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analytics.recentPayments.map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-8 py-5 text-gray-900 font-bold text-sm tracking-tight">{payment.tenantName}</td>
                            <td className="px-8 py-5">
                              <span className="text-emerald-600 font-mono font-bold leading-none">{payment.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-8 py-5 uppercase text-[10px] font-black tracking-widest text-gray-400">{payment.method}</td>
                            <td className="px-8 py-5 text-xs text-gray-500 font-medium">{new Date(payment.date).toLocaleDateString()}</td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                payment.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'schools' && (
              <motion.div
                key="schools"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96 text-left">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Filter by school name or domain..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-brand-green transition-colors text-gray-900 placeholder:text-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                       <button className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 hover:text-brand-green hover:border-brand-green transition-all">
                         <Filter size={18} />
                       </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                          <th className="px-8 py-4">Institution Profile</th>
                          <th className="px-8 py-4">Platform Domain</th>
                          <th className="px-8 py-4">Subscription Plan</th>
                          <th className="px-8 py-4">Tenant Status</th>
                          <th className="px-8 py-4 text-right">Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {filteredTenants.length > 0 ? (
                           filteredTenants.map((tenant) => (
                             <tr key={tenant.id} className="hover:bg-gray-50 transition-colors group">
                               <td className="px-8 py-6">
                                 <div className="font-bold text-gray-900 tracking-tight">{tenant.name}</div>
                                 <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">ID: {tenant.id.split('-')[0]}</div>
                               </td>
                               <td className="px-8 py-6">
                                 <span className="text-xs font-mono text-indigo-600 font-bold">{tenant.domain}</span>
                               </td>
                               <td className="px-8 py-6">
                                 <div className="flex items-center space-x-2">
                                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                     tenant.plan === 'enterprise' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                     tenant.plan === 'premium' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                     'bg-blue-50 text-blue-600 border-blue-200'
                                   }`}>
                                     {tenant.plan}
                                   </span>
                                   <button 
                                     onClick={() => { setSelectedTenant(tenant); setShowPlanModal(true); }}
                                     className="p-1.5 text-gray-300 hover:text-brand-green transition-colors"
                                     title="Edit Subscription"
                                   >
                                     <Settings size={14} />
                                   </button>
                                 </div>
                               </td>
                               <td className="px-8 py-6">
                                 <button 
                                   onClick={() => handleToggleStatus(tenant.id, tenant.subscriptionStatus)}
                                   className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                     tenant.subscriptionStatus === 'active' 
                                       ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                       : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                   }`}
                                 >
                                   <span className={`w-1.5 h-1.5 rounded-full ${tenant.subscriptionStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                   <span>{tenant.subscriptionStatus}</span>
                                 </button>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <Link to={`/super-admin/tenants/${tenant.id}`} className="p-2 text-gray-300 hover:text-brand-green transition-colors inline-block">
                                    <MoreVertical size={18} />
                                  </Link>
                               </td>
                             </tr>
                           ))
                         ) : (
                           <tr>
                              <td colSpan={5} className="px-8 py-32 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 border border-gray-100">
                                    <Building size={32} className="text-gray-200" />
                                  </div>
                                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">No Institutions Found</h3>
                                  <p className="text-gray-500 mt-3 text-sm font-medium max-w-xs mx-auto">
                                    The global network is waiting for its first node. Direct enrollment is required to proceed.
                                  </p>
                                  <button 
                                    onClick={() => setShowEnrollModal(true)}
                                    className="mt-8 px-8 py-3 bg-brand-green text-brand-sand rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-green/10 active:scale-95 transition-all"
                                  >
                                    Enroll First Institution
                                  </button>
                                </div>
                              </td>
                           </tr>
                         )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'financials' && (
               <motion.div key="financials" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-1 bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm text-left">
                       <h3 className="text-xl font-bold mb-6 text-gray-900 leading-none tracking-tight">Revenue Summary</h3>
                       <div className="space-y-6">
                          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                             <span className="text-gray-500 font-medium">Total Lifetime Revenue</span>
                             <span className="text-2xl font-black text-emerald-600 tracking-tight">KES {analytics?.totalRevenue?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                             <span className="text-gray-500 font-medium">Active Recurring Subscriptions</span>
                             <span className="text-2xl font-black text-gray-900 tracking-tight">{analytics?.activeSubscriptions}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-gray-500 font-medium">Pending Manual Verifications</span>
                             <span className="text-2xl font-black text-yellow-600 tracking-tight font-mono">{analytics?.pendingApprovals}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="lg:col-span-2 bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm text-left">
                       <h3 className="text-xl font-bold mb-6 text-gray-900 leading-none tracking-tight text-center">Pending Confirmations</h3>
                       <div className="overflow-x-auto">
                         <table className="w-full text-left border-separate border-spacing-0">
                           <thead>
                             <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                               <th className="px-6 py-4">School</th>
                               <th className="px-6 py-4">Amount</th>
                               <th className="px-6 py-4 text-right">Action</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                             {analytics?.recentPayments?.filter((p: any) => p.status === 'Pending').map((payment: any) => (
                               <tr key={payment.id} className="group hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-5">
                                   <div className="font-bold text-gray-900 text-sm tracking-tight">{payment.tenantName}</div>
                                 </td>
                                 <td className="px-6 py-5 font-mono font-bold text-emerald-600 text-sm">KES {payment.amount.toLocaleString()}</td>
                                 <td className="px-6 py-5 text-right">
                                   <button 
                                     onClick={async () => {
                                       if (confirm(`Confirm payment of KES ${payment.amount} for ${payment.tenantName}?`)) {
                                         try {
                                           await api.post(`/super-admin/payments/${payment.id}/confirm`);
                                           toast.success('Payment confirmed and tenant activated.');
                                           fetchData();
                                         } catch (error) {
                                           toast.error('Failed to confirm payment.');
                                         }
                                       }
                                     }}
                                     className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                                     title="Activate Account"
                                   >
                                     <CheckCircle size={18} />
                                   </button>
                                 </td>
                               </tr>
                             ))}
                             {analytics?.recentPayments?.filter((p: any) => p.status === 'Pending').length === 0 && (
                               <tr>
                                 <td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-xs font-medium uppercase tracking-widest italic">
                                   No pending wire transfers found.
                                 </td>
                               </tr>
                             )}
                           </tbody>
                         </table>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden mb-12">
                    <div className="p-8 border-b border-gray-100">
                       <h3 className="text-xl font-bold text-gray-900 leading-none tracking-tight">Platform Transaction Ledger</h3>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-separate border-spacing-0">
                         <thead>
                           <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                             <th className="px-8 py-4">Institution</th>
                             <th className="px-8 py-4">Amount (KES)</th>
                             <th className="px-8 py-4">Method</th>
                             <th className="px-8 py-4">Date</th>
                             <th className="px-8 py-4">Status</th>
                             <th className="px-8 py-4 text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                           {analytics?.recentPayments?.map((payment: any) => (
                             <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                               <td className="px-8 py-5 font-bold text-gray-900 text-sm tracking-tight">{payment.tenantName}</td>
                               <td className="px-8 py-5 font-mono font-bold text-emerald-600">{(payment.amount || 0).toLocaleString()}</td>
                               <td className="px-8 py-5 uppercase text-[10px] font-black tracking-widest text-gray-400">{payment.method}</td>
                               <td className="px-8 py-5 text-sm text-gray-500 font-medium">{new Date(payment.date).toLocaleDateString()}</td>
                               <td className="px-8 py-5">
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                    payment.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'
                                 }`}>
                                   {payment.status}
                                 </span>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                     {payment.status === 'Approved' && (
                                       <button 
                                         onClick={async () => {
                                           try {
                                             await api.post(`/super-admin/payments/${payment.id}/resend`);
                                             toast.success('Receipt resent to school email.');
                                           } catch (error) {
                                             toast.error('Failed to resend receipt');
                                           }
                                         }}
                                         className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" 
                                         title="Resend Receipt"
                                       >
                                          <CheckCircle size={16} />
                                       </button>
                                     )}
                                     <button 
                                       onClick={async () => {
                                         try {
                                           const docType = payment.status === 'Approved' ? 'receipt' : 'invoice';
                                           const response = await api.get(`/super-admin/payments/${payment.id}/${docType}`, { responseType: 'blob' });
                                           const url = window.URL.createObjectURL(new Blob([response.data]));
                                           const link = document.createElement('a');
                                           link.href = url;
                                           link.setAttribute('download', `${docType.charAt(0).toUpperCase() + docType.slice(1)}-${payment.reference || payment.id}.pdf`);
                                           document.body.appendChild(link);
                                           link.click();
                                           link.remove();
                                         } catch (error) {
                                           toast.error('Failed to download document');
                                         }
                                       }}
                                       className="p-2 text-gray-400 hover:text-brand-green transition-colors" 
                                       title="Download Invoice/Receipt"
                                     >
                                        <ArrowRight size={16} />
                                     </button>
                                  </div>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                 </div>
               </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-white border border-gray-100 p-12 rounded-[40px] text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-gray-100">
                    <Settings size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-gray-900 tracking-tight leading-none">Infrastructure Gateway Configuration</h3>
                  <p className="text-gray-500 max-w-lg mx-auto mb-10 text-[15px] font-medium leading-relaxed">Adjust global environment variables, payment credentials, and system-wide default parameters for the entire platform.</p>
                  <Link to="/super-admin/settings" className="px-8 py-4 bg-brand-green text-brand-sand rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-brand-green/20 active:scale-95 inline-block">
                    Access Configuration Engine
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

      {/* Plan Modification Modal */}
      <AnimatePresence>
        {showPlanModal && selectedTenant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-[40px] p-10 max-w-md w-full shadow-2xl relative text-left"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                  <Star className="text-purple-600" size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black tracking-tight text-gray-900 leading-none">Modify Subscription</h2>
                   <p className="text-[10px] text-purple-600 uppercase tracking-[0.2em] font-black mt-2">{selectedTenant.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => handleUpdatePlan(selectedTenant.id, 'enterprise')}
                  className="w-full p-5 bg-purple-50 border border-purple-100 rounded-3xl flex items-center justify-between group hover:bg-purple-100 transition-all border-l-[6px] border-l-purple-600"
                  disabled={updatingPlan}
                >
                  <div className="text-left">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Infrastructure Tier</span>
                    <span className="text-lg font-black text-gray-900 tracking-tight">Full Enterprise Access</span>
                  </div>
                  <CheckCircle size={24} className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="grid grid-cols-1 gap-2">
                  {['free', 'basic', 'standard', 'premium'].map((p) => (
                    <button 
                      key={p}
                      onClick={() => handleUpdatePlan(selectedTenant.id, p)}
                      className={`p-4 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                        selectedTenant.plan === p 
                        ? 'bg-brand-green/5 border-brand-green/20 ring-1 ring-brand-green/10' 
                        : 'bg-gray-50 border-gray-100 hover:border-brand-green/30 list-none'
                      }`}
                      disabled={updatingPlan}
                    >
                      <span className={`text-[11px] font-black uppercase tracking-widest ${selectedTenant.plan === p ? 'text-brand-green' : 'text-gray-500'}`}>{p} Plan</span>
                      {selectedTenant.plan === p && <CheckCircle size={16} className="text-brand-green" />}
                      {selectedTenant.plan !== p && <div className="w-4 h-4 rounded-full border border-gray-200 group-hover:border-brand-green/30"></div>}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowPlanModal(false)}
                className="mt-10 w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors"
                disabled={updatingPlan}
              >
                Abort Changes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Enrollment Modal */}
      <AnimatePresence>
        {showEnrollModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative text-left"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-14 h-14 bg-brand-green/5 rounded-2xl flex items-center justify-center border border-brand-green/10">
                  <Building className="text-brand-green" size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black tracking-tight text-gray-900 leading-none">External Enrollment</h2>
                   <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mt-2">Scale the educational network</p>
                </div>
              </div>

              <form onSubmit={handleEnrollTenant} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 ml-1">Entity Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/5 text-gray-900 font-medium placeholder:text-gray-300 transition-all"
                      placeholder="e.g. Skyline Academy"
                      value={newTenant.name}
                      onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 ml-1">Virtual Infrastructure Domain</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/5 text-gray-900 font-mono placeholder:text-gray-300 transition-all font-bold"
                      placeholder="e.g. skyline.saaslink.tech"
                      value={newTenant.domain}
                      onChange={e => setNewTenant({...newTenant, domain: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 ml-1">Primary Admin Identity (Email)</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/5 text-gray-900 font-medium placeholder:text-gray-300 transition-all"
                      placeholder="principal@skyline.ac"
                      value={newTenant.email}
                      onChange={e => setNewTenant({...newTenant, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 ml-1">Subscription Vector</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-green appearance-none text-gray-900 font-bold"
                          value={newTenant.plan}
                          onChange={e => setNewTenant({...newTenant, plan: e.target.value})}
                        >
                          <option value="free">L0: Foundation</option>
                          <option value="basic">L1: Essential</option>
                          <option value="standard">L2: Standard</option>
                          <option value="premium">L3: Premium</option>
                          <option value="enterprise">LX: Enterprise</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ArrowRight size={14} className="text-gray-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 ml-1">Fee Allocation (KES)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/5 text-gray-900 font-black placeholder:text-gray-300 transition-all font-mono"
                        value={newTenant.subscriptionFee}
                        placeholder="0"
                        onChange={e => setNewTenant({...newTenant, subscriptionFee: e.target.value as any})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex items-center space-x-4">
                  <button 
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="flex-1 px-8 py-5 bg-gray-50 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-700 transition-all active:scale-95 border border-gray-100"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={enrolling}
                    className="flex-1 px-8 py-5 bg-brand-green text-brand-sand rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-brand-green/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                  >
                    {enrolling ? (
                      <div className="w-4 h-4 border-2 border-brand-sand border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Deploy Infrastructure</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminPage;

