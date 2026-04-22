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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    indigo: 'bg-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <motion.div
      className="bg-gray-800 p-6 rounded-2xl flex items-center space-x-4 border border-gray-700"
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className={`p-3 rounded-xl ${colorMap[color] || 'bg-gray-500/20 text-gray-400'}`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
    </motion.div>
  );
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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
  const [newTenant, setNewTenant] = useState({ name: '', domain: '', plan: 'standard', email: '', subscriptionFee: 0 });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, tenantsRes] = await Promise.all([
        api.get('/super-admin/analytics').catch(e => ({ data: null })),
        api.get('/super-admin/tenants').catch(e => ({ data: [] }))
      ]);
      setAnalytics(analyticsRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
      setNewTenant({ name: '', domain: '', plan: 'standard' });
      alert('School enrolled successfully!');
    } catch (error) {
       console.error('Failed to enroll tenant:', error);
       alert('Failed to enroll school. Name or domain might already exist.');
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
      alert(`Subscription updated to ${plan} successfully.`);
    } catch (error) {
      console.error('Failed to update plan:', error);
      alert('Failed to update subscription.');
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
      <div className="flex space-x-1 bg-white p-1 rounded-2xl border border-gray-100 mb-10 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
          { id: 'schools', label: 'Institutions', icon: <Building size={16} /> },
          { id: 'financials', label: 'Financials', icon: <Wallet size={16} /> },
          { id: 'settings', label: 'Logic & Config', icon: <Settings size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center space-x-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-brand-green text-brand-sand shadow-lg shadow-brand-green/10' 
                : 'text-gray-500 hover:text-brand-green'
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
          <div className="flex items-center space-x-2 text-brand-sand uppercase tracking-[0.3em] text-[10px] font-black mb-3">
            <Globe size={12} />
            <span>Infrastructure Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 leading-none">
            {activeTab === 'overview' && 'System Analytics'}
            {activeTab === 'schools' && 'Managed Schools'}
            {activeTab === 'financials' && 'Revenue Vectors'}
            {activeTab === 'settings' && 'Platform Logic'}
          </h1>
          <p className="text-gray-400 mt-4 font-medium max-w-xl">
            {activeTab === 'overview' && 'Comprehensive real-time instrumentation across all provisioned platform nodes and educational clusters.'}
            {activeTab === 'schools' && 'Direct management and state control for all high-value educational institutions within the SaaSLink network.'}
            {activeTab === 'financials' && 'Centralized ledger for all subscription revenue, manual bank reconciliation, and fiscal health tracking.'}
            {activeTab === 'settings' && 'Critical platform parameters, gateway logic, and ecosystem configuration for the entire EMIS network.'}
          </p>
        </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all active:scale-95"
              >
                Refresh Data
              </button>
              {activeTab === 'schools' && (
                <button 
                  onClick={() => setShowEnrollModal(true)}
                  className="px-5 py-2 bg-brand-sand text-brand-dark rounded-xl text-sm font-bold flex items-center shadow-lg shadow-brand-sand/10 active:scale-95"
                >
                  <Plus size={16} className="mr-2" />
                  Direct Enrollment
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-12">
                  <StatCard icon={<Building size={20} />} label="Total Schools" value={analytics.totalTenants} color="blue" />
                  <StatCard icon={<CheckCircle size={20} />} label="Active Subs" value={analytics.activeSubscriptions} color="green" />
                  <StatCard icon={<GraduationCap size={20} />} label="Student Base" value={analytics.totalStudents} color="purple" />
                  <StatCard icon={<ArrowRight size={20} />} label="Attendance" value={`${analytics.averageAttendance}%`} color="indigo" />
                  <StatCard icon={<Wallet size={20} />} label="Gross Revenue" value={`KES ${analytics.totalRevenue.toLocaleString()}`} color="emerald" />
                  <StatCard icon={<Bell size={20} />} label="Approvals" value={analytics.pendingApprovals} color="yellow" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold tracking-tight">Growth & Revenue</h3>
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Monthly KES</span>
                      </div>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.revenueOverTime}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="month" stroke="#4b5563" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <YAxis stroke="#4b5563" axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                            itemStyle={{ color: '#10b981' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Market Share */}
                  <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold tracking-tight mb-8">Plan Distribution</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.tenantsByPlan}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {analytics.tenantsByPlan.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent Payments Preview */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden mb-12">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-bold tracking-tight">Financial Stream</h3>
                    <button onClick={() => setActiveTab('financials')} className="text-xs font-bold text-brand-sand uppercase tracking-widest flex items-center hover:opacity-80 transition-opacity">
                      Operational Ledger <ArrowRight size={14} className="ml-2" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-white/[0.02] text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                          <th className="px-8 py-4">Institution</th>
                          <th className="px-8 py-4">Volume (KES)</th>
                          <th className="px-8 py-4">Gateway</th>
                          <th className="px-8 py-4">Timestamp</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {analytics.recentPayments.map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-white/[0.03] transition-colors group">
                            <td className="px-8 py-5">
                              <div className="font-bold text-sm tracking-tight">{payment.tenantName}</div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-emerald-400 font-mono font-bold">{payment.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-8 py-5 uppercase text-[10px] font-black tracking-widest text-gray-500">{payment.method}</td>
                            <td className="px-8 py-5 text-xs text-gray-500 font-medium">{new Date(payment.date).toLocaleDateString()}</td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                payment.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
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
                <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Filter by school name or domain..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-brand-sand transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                       <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-colors">
                         <Filter size={18} />
                       </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-white/[0.02] text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                          <th className="px-8 py-4">Institution Profile</th>
                          <th className="px-8 py-4">Platform Domain</th>
                          <th className="px-8 py-4">Subscription Plan</th>
                          <th className="px-8 py-4">Tenant Status</th>
                          <th className="px-8 py-4 text-right">Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredTenants.map((tenant) => (
                          <tr key={tenant.id} className="hover:bg-white/[0.03] transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-bold text-white tracking-tight">{tenant.name}</div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">ID: {tenant.id.split('-')[0]}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-xs font-mono text-brand-sand/60">{tenant.domain}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                  tenant.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                  tenant.plan === 'premium' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                  {tenant.plan}
                                </span>
                                <button 
                                  onClick={() => { setSelectedTenant(tenant); setShowPlanModal(true); }}
                                  className="p-1.5 text-gray-600 hover:text-brand-sand transition-colors"
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
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${tenant.subscriptionStatus === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                <span>{tenant.subscriptionStatus}</span>
                              </button>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <Link to={`/super-admin/tenants/${tenant.id}`} className="p-2 text-gray-500 hover:text-white transition-colors inline-block">
                                 <MoreVertical size={18} />
                               </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'financials' && (
               <motion.div key="financials" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 {/* Financial view logic - reusing analytics recent payments but expanded */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                       <h3 className="text-xl font-bold mb-6">Revenue Overview</h3>
                       <div className="space-y-6">
                          <div className="flex justify-between items-center pb-4 border-b border-white/5">
                             <span className="text-gray-500 font-medium">Total Lifetime Revenue</span>
                             <span className="text-2xl font-bold text-emerald-400">KES {analytics?.totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pb-4 border-b border-white/5">
                             <span className="text-gray-500 font-medium">Active Recurring Subscriptions</span>
                             <span className="text-2xl font-bold text-white">{analytics?.activeSubscriptions}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-gray-500 font-medium">Pending Manual Verifications</span>
                             <span className="text-2xl font-bold text-yellow-400 font-mono">{analytics?.pendingApprovals}</span>
                          </div>
                       </div>
                       <Link to="/super-admin/financials" className="mt-8 w-full block text-center py-4 bg-white/5 text-brand-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/10">
                          Complete Financial Ledger
                       </Link>
                    </div>
                    
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                       <h3 className="text-xl font-bold mb-6">Subscription Market Share</h3>
                       <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={analytics?.tenantsByPlan} dataKey="value" stroke="none" innerRadius={60} outerRadius={80}>
                                 {analytics?.tenantsByPlan.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                               <Legend />
                            </PieChart>
                         </ResponsiveContainer>
                       </div>
                    </div>
                 </div>
               </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-gray-900/50 border border-white/5 p-12 rounded-[40px] text-center">
                  <Settings size={48} className="mx-auto text-gray-700 mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Infrastructure Gateway Configuration</h3>
                  <p className="text-gray-500 max-w-lg mx-auto mb-10">Adjust global environment variables, payment credentials, and system-wide default parameters.</p>
                  <Link to="/super-admin/settings" className="px-8 py-4 bg-brand-sand text-brand-dark rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-brand-sand/10 active:scale-95 inline-block">
                    Access Configuration Engine
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

      {/* Plan Modification Modal */}
      <AnimatePresence>
        {showPlanModal && selectedTenant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-[40px] p-10 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                  <Star className="text-purple-400" />
                </div>
                <div>
                   <h2 className="text-2xl font-bold tracking-tight">Modify Subscription</h2>
                   <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{selectedTenant.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handleUpdatePlan(selectedTenant.id, 'enterprise')}
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-purple-500/10 transition-all border-l-4 border-l-purple-500"
                  disabled={updatingPlan}
                >
                  <div className="text-left">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-purple-400">Top Tier</span>
                    <span className="text-lg font-bold text-white">Enroll in Enterprise</span>
                  </div>
                  <CheckCircle size={20} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="grid grid-cols-1 gap-3">
                  {['free', 'basic', 'standard', 'premium'].map((p) => (
                    <button 
                      key={p}
                      onClick={() => handleUpdatePlan(selectedTenant.id, p)}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-all flex items-center justify-between uppercase text-[10px] font-bold tracking-widest"
                      disabled={updatingPlan}
                    >
                      <span className={selectedTenant.plan === p ? 'text-brand-sand' : 'text-gray-400'}>{p} Plan</span>
                      {selectedTenant.plan === p && <CheckCircle size={14} className="text-brand-sand" />}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowPlanModal(false)}
                className="mt-8 w-full text-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                disabled={updatingPlan}
              >
                Close Without Changes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Enrollment Modal */}
      <AnimatePresence>
        {showEnrollModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-[40px] p-10 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-brand-sand/10 rounded-2xl flex items-center justify-center">
                  <Building className="text-brand-sand" />
                </div>
                <div>
                   <h2 className="text-2xl font-bold tracking-tight">Direct Enrollment</h2>
                   <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Register new school infrastructure</p>
                </div>
              </div>

              <form onSubmit={handleEnrollTenant} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">School Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-sand"
                      placeholder="e.g. Skyline Academy"
                      value={newTenant.name}
                      onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Platform Domain</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-sand"
                      placeholder="e.g. skyline.saaslink.tech"
                      value={newTenant.domain}
                      onChange={e => setNewTenant({...newTenant, domain: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Admin Email (Required for Credentials)</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-sand"
                      placeholder="e.g. principal@skyline.ac"
                      value={newTenant.email}
                      onChange={e => setNewTenant({...newTenant, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Package</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-sand appearance-none"
                        value={newTenant.plan}
                        onChange={e => setNewTenant({...newTenant, plan: e.target.value})}
                      >
                        <option value="free">Free Tier</option>
                        <option value="basic">Basic School</option>
                        <option value="standard">Standard Academy</option>
                        <option value="premium">Premium Institution</option>
                        <option value="enterprise">Enterprise Infrastructure</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Subscription Fee (KES)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-sand"
                        value={newTenant.subscriptionFee}
                        onChange={e => setNewTenant({...newTenant, subscriptionFee: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center space-x-4">
                  <button 
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="flex-1 px-6 py-4 bg-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={enrolling}
                    className="flex-1 px-6 py-4 bg-brand-sand text-brand-dark rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand-sand/10 active:scale-95 disabled:opacity-50"
                  >
                    {enrolling ? 'Provisioning...' : 'Provision Now'}
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

