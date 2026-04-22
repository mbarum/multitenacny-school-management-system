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
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  };

  return (
    <motion.div
      className="bg-white p-6 rounded-3xl flex items-center space-x-4 border border-gray-100 shadow-sm"
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className={`p-4 rounded-2xl ${colorMap[color] || 'bg-gray-50 text-gray-400 border-gray-100'} border`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{label}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
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
      
      setAnalytics(analyticsRes.data);
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
                  <div className="lg:col-span-2 bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold tracking-tight text-gray-900">Growth & Revenue</h3>
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Monthly KES</span>
                      </div>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.revenueOverTime}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="month" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', color: '#111', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#10b981' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Market Share */}
                  <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm">
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-8">Plan Distribution</h3>
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
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', color: '#111', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
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
                        {filteredTenants.map((tenant) => (
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
                    <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm text-left">
                       <h3 className="text-xl font-bold mb-6 text-gray-900 leading-none tracking-tight">Revenue Overview</h3>
                       <div className="space-y-6">
                          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                             <span className="text-gray-500 font-medium">Total Lifetime Revenue</span>
                             <span className="text-2xl font-black text-emerald-600 tracking-tight">KES {analytics?.totalRevenue.toLocaleString()}</span>
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
                       <Link to="/super-admin/financials" className="mt-8 w-full block text-center py-4 bg-gray-50 text-gray-900 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-gray-100 border border-gray-100">
                          Complete Financial Ledger
                       </Link>
                    </div>
                    
                    <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm text-left">
                       <h3 className="text-xl font-bold mb-6 text-gray-900 leading-none tracking-tight">Subscription Market Share</h3>
                       <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={analytics?.tenantsByPlan} dataKey="value" stroke="none" innerRadius={60} outerRadius={80}>
                                 {analytics?.tenantsByPlan.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
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

