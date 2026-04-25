import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Globe, 
  BarChart3, 
  ChevronRight,
  Menu,
  Moon,
  Sun,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-canvas text-on-canvas transition-colors duration-500 font-sans selection:bg-brand-gold selection:text-surface">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-canvas/80 backdrop-blur-xl border-b border-border-muted h-20 flex items-center">
        <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center space-x-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-accent-color transition-all group-hover:rotate-6 shadow-lg shadow-accent-color/20">
              <Activity className="text-surface" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-[0.2em] uppercase italic leading-none text-on-canvas">Saaslink</span>
              <div className="h-[2px] w-full bg-brand-gold mt-1.5 shadow-sm" />
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-12">
            {[
              { name: 'Architecture', href: '#architecture' },
              { name: 'Registry', href: '#registry' },
              { name: 'Financials', href: '#financials' },
              { name: 'Support', href: '#support' }
            ].map((item) => (
              <a 
                key={item.name} 
                href={item.href} 
                className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500 hover:text-on-canvas transition-all relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-brand-gold transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4 md:space-x-8">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-sm bg-surface border border-border-muted text-gray-400 hover:text-on-canvas transition-all active:scale-90"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link 
              to="/login" 
              className="hidden sm:block text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-on-canvas transition-colors"
            >
              Access_Portal
            </Link>
            <Link 
              to="/register" 
              className="bg-on-canvas text-surface px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-sm hover:opacity-90 transition-all shadow-2xl shadow-accent-color/10 active:scale-95 whitespace-nowrap"
            >
              Begin_Setup
            </Link>
            <button className="lg:hidden p-2 text-on-canvas">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - The Matrix Opening */}
      <section className="relative min-h-screen pt-40 pb-20 overflow-hidden flex items-center">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--color-on-canvas)_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-accent-color/5 blur-[120px] -z-10 rounded-full" />
        
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7"
            >
              <div className="flex items-center space-x-4 mb-10">
                <span className="h-[2px] w-12 bg-brand-gold shadow-sm" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-brand-gold">Global Academic Operating System v4.0.2</span>
              </div>
              
              <h1 className="text-[64px] md:text-[96px] lg:text-[110px] font-serif italic text-on-canvas leading-[0.85] tracking-tighter mb-12">
                Engineering <br /> 
                <span className="opacity-20">Scholastic</span> <br />
                Integrity.
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-500 font-sans max-w-2xl leading-relaxed mb-16 italic font-medium">
                The high-precision instrument for institutional orchestration. 
                Synchronize registry, finance, and human capital through a single, 
                verifiable administrative ledger.
              </p>

              <div className="flex flex-col md:flex-row gap-6">
                <Link 
                  to="/register" 
                  className="group flex items-center justify-between bg-on-canvas text-surface px-12 py-7 rounded-sm transition-all hover:scale-[1.03] active:scale-95 shadow-2xl shadow-accent-color/20"
                >
                  <div className="flex flex-col items-start pr-16 border-r border-surface/10">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60 mb-1">Entry Node</span>
                    <span className="text-xl font-bold uppercase italic tracking-tight">Student_Registration</span>
                  </div>
                  <ChevronRight className="group-hover:translate-x-3 transition-transform ml-8 text-brand-gold" size={24} />
                </Link>
                
                <Link 
                  to="/login"
                  className="group flex items-center justify-between border border-border-muted bg-surface text-on-canvas px-12 py-7 rounded-sm transition-all hover:border-on-canvas"
                >
                  <div className="flex flex-col items-start pr-16 border-r border-border-muted">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40 mb-1">Command Unit</span>
                    <span className="text-xl font-bold uppercase italic tracking-tight">Faculty_Access</span>
                  </div>
                  <ArrowRight className="group-hover:translate-x-3 transition-transform ml-8 text-brand-gold" size={24} />
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="lg:col-span-5 hidden lg:block"
            >
              <div className="relative">
                <div className="aspect-[4/5] bg-surface border border-border-muted p-4 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] relative z-10 rotate-1 group transition-transform hover:rotate-0 duration-700">
                  <div className="w-full h-full bg-canvas border border-border-muted flex flex-col p-8 overflow-hidden relative">
                    <div className="flex justify-between items-center mb-12">
                      <div className="space-y-1">
                        <div className="h-3 w-24 bg-on-canvas/10 rounded-full" />
                        <div className="h-1.5 w-12 bg-brand-gold/20 rounded-full" />
                      </div>
                      <div className="w-10 h-10 border border-border-muted rounded-full flex items-center justify-center">
                        <Target size={16} className="text-brand-gold" />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="h-px w-full bg-border-muted" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-surface border border-border-muted rounded-sm p-4">
                          <div className="h-2 w-1/2 bg-gray-200 mb-4" />
                          <div className="h-6 w-3/4 bg-on-canvas opacity-5" />
                        </div>
                        <div className="h-24 bg-accent-color rounded-sm p-4">
                          <div className="h-2 w-1/2 bg-surface/30 mb-4" />
                          <div className="h-6 w-3/4 bg-surface" />
                        </div>
                      </div>
                      <div className="h-40 bg-surface border border-border-muted rounded-sm flex flex-col justify-between p-6">
                         <div className="h-3 w-1/3 bg-gray-200" />
                         <div className="flex items-end gap-3 h-20">
                            <div className="flex-1 bg-on-canvas/5 h-[30%]" />
                            <div className="flex-1 bg-on-canvas/5 h-[60%]" />
                            <div className="flex-1 bg-brand-gold h-[90%]" />
                            <div className="flex-1 bg-on-canvas/5 h-[50%]" />
                         </div>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60 pointer-events-none" />
                  </div>
                </div>
                {/* Decorative Frame */}
                <div className="absolute -inset-8 border border-border-muted -z-10 rounded-sm opacity-50" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Grid - The Ledger Proof */}
      <section className="bg-surface border-y border-border-muted py-0">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-muted group">
            {[
              { label: 'Latency_Index', value: '<24ms', sub: 'Instantaneous Sync' },
              { label: 'Registry_Count', value: '1.2M+', sub: 'Verified Identities' },
              { label: 'Uptime_Stat', value: '99.99%', sub: 'Zero-Downtime Architecture' },
              { label: 'Security_Level', value: 'AES-256', sub: 'Institutional Grade' },
            ].map((stat) => (
              <div key={stat.label} className="p-16 hover:bg-canvas transition-colors duration-500">
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.4em] mb-6">{stat.label}</p>
                <h3 className="text-5xl font-serif italic text-on-canvas leading-none tracking-tighter mb-4">{stat.value}</h3>
                <p className="text-[10px] font-bold text-brand-gold uppercase italic tracking-[0.2em]">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section id="architecture" className="py-40 border-b border-border-muted relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-full bg-accent-color/5 blur-[100px] -z-10" />
        
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
            <div className="lg:col-span-12 mb-16">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-[1px] bg-brand-gold" />
                <h2 className="text-[11px] font-mono font-bold uppercase tracking-[0.5em] text-on-canvas italic">Institutional Ecosystem</h2>
              </div>
              <h3 className="text-5xl md:text-7xl font-serif italic text-on-canvas leading-tight tracking-tight max-w-4xl">
                A Unified Operating <br />
                <span className="opacity-20 text-on-canvas">Control Standard.</span>
              </h3>
            </div>
            <div className="lg:col-span-4 space-y-12">
              {[
                { icon: <ShieldCheck size={28} className="text-brand-gold" />, title: 'Multi-Tenant Isolation', text: 'Each campus instance operates on its own encrypted logical partition, ensuring zero-compromise data privacy.' },
                { icon: <Globe size={28} className="text-brand-gold" />, title: 'Scholastic Lineage', text: 'Trace student development from admission to alumni within a single high-integrity academic record.' }
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 10 }}
                  className="flex group"
                >
                  <div className="mr-8 pt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-on-canvas uppercase italic tracking-tight mb-4 group-hover:text-brand-gold transition-colors">{feature.title}</h4>
                    <p className="text-base text-gray-500 leading-relaxed font-sans">{feature.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-4 space-y-12">
              {[
                { icon: <BarChart3 size={28} className="text-brand-gold" />, title: 'Financial Intelligence', text: 'Automated billing, real-time M-Pesa ledger sync, and granular institutional P&L reporting.' },
                { icon: <Zap size={28} className="text-brand-gold" />, title: 'High-Density Reporting', text: 'Generate ministry-standard performance reports in milliseconds, filtered by any scholastic variable.' }
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 10 }}
                  className="flex group"
                >
                  <div className="mr-8 pt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-on-canvas uppercase italic tracking-tight mb-4 group-hover:text-brand-gold transition-colors">{feature.title}</h4>
                    <p className="text-base text-gray-500 leading-relaxed font-sans">{feature.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-4 bg-surface border border-border-muted p-12 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent-color/5 rotate-45 translate-x-16 -translate-y-16 group-hover:translate-x-12 transition-transform duration-700" />
               <div className="relative z-10">
                 <h4 className="text-2xl font-serif italic text-on-canvas mb-8">Adaptive Command</h4>
                 <div className="space-y-4 mb-12">
                    {[70, 45, 90].map((w, i) => (
                       <div key={i} className="h-1.5 bg-canvas rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${w}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className="h-full bg-accent-color" 
                          />
                       </div>
                    ))}
                 </div>
                 <p className="text-sm text-gray-500 mb-8 font-sans leading-relaxed">
                   Optimized for all input methods. Desktop mastery, mobile agility.
                 </p>
                 <Link to="/register" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.4em] text-on-canvas hover:text-brand-gold transition-colors">
                   View_System_Specs <ArrowRight className="ml-3" size={14} />
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Registration / Admission Callout - Specifically requested */}
      <section id="registry" className="py-40 bg-surface border-b border-border-muted relative">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
             <div className="order-2 lg:order-1">
                <div className="aspect-video bg-canvas border border-border-muted rounded-sm p-12 flex flex-col justify-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8">
                      <Target size={40} className="text-brand-gold opacity-20 group-hover:scale-110 transition-transform duration-700" />
                   </div>
                   <h4 className="text-3xl font-serif italic text-on-canvas mb-6">Automated Admission Line</h4>
                   <p className="text-gray-400 font-sans italic leading-relaxed mb-10 max-w-sm">
                      Reduce administrative churn with our end-to-end digital application workflow. 
                      Collect documents, verify identities, and finalize enrollment in a unified stream.
                   </p>
                   <Link 
                     to="/register" 
                     className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.4em] text-on-canvas group-hover:text-brand-gold transition-colors"
                   >
                     Deploy_Admission_Portal <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform" />
                   </Link>
                </div>
             </div>
             <div className="order-1 lg:order-2">
                <div className="flex items-center space-x-4 mb-10">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-brand-gold">Node: Enrollment_Center</span>
                </div>
                <h3 className="text-5xl font-serif italic text-on-canvas mb-8 leading-tight">
                  Seamless Student <br />
                  <span className="opacity-20">Onboarding.</span>
                </h3>
                <p className="text-lg text-gray-500 font-sans italic mb-12 leading-relaxed">
                  Provide prospective families with a world-class first impression. Our registration portal 
                  is optimized for mobile conversion, ensuring high completion rates for busy parents.
                </p>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <div className="text-2xl font-serif italic text-on-canvas">85%</div>
                      <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Efficiency Gain</div>
                   </div>
                   <div className="space-y-2">
                      <div className="text-2xl font-serif italic text-on-canvas">Zero</div>
                      <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Paper Dependency</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Call to Action - The Final Deployment */}
      <section className="py-48 bg-canvas relative overflow-hidden">
        <div className="absolute inset-0 bg-accent-color/5 opacity-50 z-0" />
        <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-full h-full bg-accent-color/10 blur-[150px] -z-10 rounded-full" />
        
        <div className="max-w-[1400px] mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-6xl md:text-8xl font-serif italic text-on-canvas tracking-tighter mb-16 leading-[0.9]">
              Re-architecting <br />
              <span className="opacity-20 text-on-canvas">Institutional Trust.</span>
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-12">
              <Link 
                to="/register" 
                className="w-full sm:w-auto bg-on-canvas text-surface px-16 py-8 text-xs font-black uppercase tracking-[0.4em] rounded-sm hover:-translate-y-2 transition-all shadow-2xl shadow-accent-color/30 active:scale-95"
              >
                Inbound_Admission
              </Link>
              <Link 
                to="/contact" 
                className="w-full sm:w-auto text-[11px] font-black uppercase tracking-[0.5em] text-gray-500 hover:text-on-canvas transition-all relative py-4 group"
              >
                Request_Command_Demo
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-gold group-hover:h-1 transition-all" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - The Matrix Root */}
      <footer className="bg-surface border-t border-border-muted pt-32 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 mb-32">
            <div className="md:col-span-5">
              <div className="flex items-center space-x-4 mb-10 group">
                <div className="w-12 h-12 bg-on-canvas flex items-center justify-center rounded-sm transition-transform group-hover:rotate-12 shadow-xl shadow-accent-color/10">
                  <Activity className="text-surface" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-[0.3em] uppercase italic leading-none">Saaslink</span>
                  <div className="h-[2px] w-full bg-brand-gold mt-1.5" />
                </div>
              </div>
              <p className="max-w-md text-gray-400 text-lg font-sans italic leading-relaxed font-medium">
                Designing the definitive ledger for regional academic dominance. 
                SaaSLink architecture ensures zero-latency institutional operations 
                at global scale.
              </p>
            </div>
            
            <div className="md:col-span-2">
              <h5 className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-on-canvas mb-10">Access_Nodes</h5>
              <ul className="space-y-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <li><Link to="/register" className="hover:text-brand-gold transition-colors italic">Admission_Portal</Link></li>
                <li><Link to="/login" className="hover:text-brand-gold transition-colors italic">Command_Center</Link></li>
                <li><Link to="/pricing" className="hover:text-brand-gold transition-colors italic">Subscription_Log</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-on-canvas mb-10">Protocol</h5>
              <ul className="space-y-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <li><a href="#" className="hover:text-brand-gold transition-colors italic">Privacy_Firewall</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors italic">Matrix_Agreement</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors italic">System_Logs</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h5 className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-on-canvas mb-10">Verification_Origin</h5>
              <div className="p-8 bg-canvas border border-border-muted rounded-sm">
                 <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-loose">
                    Server_Node: GH-West-2 <br />
                    Enc: TLS_v1.3_AES_256 <br />
                    Status: Nominal_State
                 </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.6em] border-t border-border-muted pt-16">
            <div className="mb-8 md:mb-0">©2026 SAASLINK_INTELLIGENCE — ALL_RIGHTS_RESERVED</div>
            <div className="flex gap-12">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> NETWORK_STABLE</span>
              <span className="opacity-50">v4.0.2-STABLE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
