import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  BarChart3, 
  ChevronRight,
  Menu,
  Moon,
  Sun,
  Layout,
  Users,
  Wallet,
  GraduationCap,
  Clock,
  BookOpen,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-canvas text-on-surface transition-colors duration-700 font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation Layer */}
      <nav className="fixed top-0 w-full z-[100] bg-canvas/80 backdrop-blur-xl border-b border-border-muted h-24 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-8 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 dark:bg-primary flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-on-surface uppercase italic">SaaSLink</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] -mt-1">Institutional</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-12 font-bold text-slate-500 dark:text-slate-400">
            {['Features', 'Solutions', 'Services', 'Pricing'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="hover:text-primary transition-all relative group py-2"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-surface border border-border-muted text-slate-400 hover:text-primary transition-all shadow-sm active:scale-90"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link to="/login" className="hidden sm:block font-bold text-slate-500 hover:text-primary transition-colors tracking-tight">
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="bg-slate-900 dark:bg-primary text-white px-8 py-3.5 font-black rounded-2xl hover:bg-primary-dark transition-all shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 uppercase text-[10px] tracking-[0.2em]"
            >
              Get Started
            </Link>
            <button className="lg:hidden p-2 text-slate-400">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero: Neural Core */}
      <section className="relative pt-60 pb-44 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-[1000px] pointer-events-none -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 -left-[20%] w-[60%] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[400px] bg-primary/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-slate-900 border border-white/5 text-white/80 text-[10px] font-bold mb-10 uppercase tracking-[0.3em] shadow-2xl">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
                V4.0 System Management Active
              </div>
              
              <h1 className="text-[3.5rem] md:text-[5.5rem] font-black text-on-surface leading-[0.9] mb-10 tracking-[-0.04em]">
                The Integrated <br />
                <span className="text-primary italic">Backbone</span> for Modern <br />
                Schools.
              </h1>
              
              <p className="text-xl text-slate-500 dark:text-slate-400 mb-14 leading-relaxed max-w-xl font-medium tracking-tight">
                Empowering the next generation of school leadership. A unified platform for administrators, teachers, and parents.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <Link 
                  to="/register" 
                  className="flex items-center justify-center bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.25em] transition-all hover:scale-110 shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.3)] active:scale-95"
                >
                  Register Your School
                  <ArrowRight className="ml-3" size={18} />
                </Link>
                <Link 
                  to="/login"
                  className="flex items-center justify-center bg-surface border border-border-muted text-slate-600 px-10 py-5 rounded-[2rem] font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm active:scale-95"
                >
                  Request a Demo
                </Link>
              </div>

              <div className="mt-20 flex items-center space-x-8">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.2, zIndex: 10, rotate: -12 }}
                      className="w-14 h-14 rounded-2xl border-4 border-canvas bg-slate-100 dark:bg-slate-800 shadow-2xl flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all cursor-pointer"
                    >
                       <div className="w-full h-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </motion.div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-on-surface leading-none">850+ Schools</span>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Institutions Managed Worldwide</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative group p-4 bg-slate-900/5 dark:bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl">
                <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 relative aspect-square md:aspect-auto">
                   {/* Mock UI Layer */}
                   <div className="absolute inset-0 bg-slate-950 p-8 flex flex-col">
                      <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                         <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500/20" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                         </div>
                         <div className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase italic">Financial Management Analysis</div>
                      </div>
                      <div className="flex-1 space-y-8">
                         <div className="h-4 w-2/3 bg-white/5 rounded-full animate-pulse" />
                         <div className="flex space-x-4">
                            <div className="flex-1 h-32 bg-primary/20 rounded-3xl border border-primary/20 shadow-inner group-hover:bg-primary/30 transition-all" />
                            <div className="w-32 h-32 bg-white/5 rounded-3xl border border-white/5" />
                         </div>
                         <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
                         <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5" />)}
                         </div>
                      </div>
                   </div>
                </div>
                {/* Floating Widgets */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-10 -right-10 bg-surface rounded-3xl shadow-2xl p-6 border border-border-muted ring-1 ring-black/5"
                >
                   <div className="flex items-center space-x-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary italic font-black">89%</div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Efficiency</span>
                   </div>
                   <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-primary" />
                   </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid: Operational Excellence */}
      <section id="features" className="py-44 bg-surface/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="max-w-3xl mb-32">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-6">Comprehensive School Ecosystem</h2>
            <h3 className="text-[3.5rem] font-black text-on-surface leading-[0.95] mb-8 tracking-tighter">Everything required to <br /><span className="text-slate-400">scale your school's success.</span></h3>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">
              We've simplified complex school operations into a streamlined, intuitive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Wallet className="text-primary" size={28} />,
                title: "Payroll & Finance",
                text: "Automated payroll processing with integrated tax calculations and direct disbursements.",
                color: "indigo"
              },
              {
                icon: <BarChart3 className="text-primary" size={28} />,
                title: "Financial Management",
                text: "End-to-end fee tracking, digital invoicing, and integrated revenue management.",
                color: "primary"
              },
              {
                icon: <Layout className="text-primary" size={28} />,
                title: "Time-Tabling",
                text: "Optimized scheduling algorithms for seamless school operations and zero conflicts.",
                color: "slate"
              },
              {
                icon: <Globe className="text-primary" size={28} />,
                title: "Communication Portal",
                text: "Integrated communication hub for parents, students, and educators.",
                color: "emerald"
              },
              {
                icon: <ShieldCheck className="text-primary" size={28} />,
                title: "Secure Records",
                text: "Bank-level security protecting absolute data integrity across your entire system.",
                color: "rose"
              },
              {
                icon: <Clock className="text-primary" size={28} />,
                title: "Attendance Tracking",
                text: "Real-time biometric attendance monitoring with instant arrival notifications.",
                color: "amber"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -10, rotate: 0.5 }}
                className="p-10 bg-canvas rounded-[2.5rem] border border-border-muted shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] hover:shadow-2xl transition-all duration-500 group"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-12">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-black text-on-surface mb-5 uppercase tracking-tight">{feature.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-bold text-sm tracking-tight">{feature.text}</p>
                <div className="mt-10 flex items-center text-[10px] uppercase font-black tracking-[0.3em] text-primary group-hover:translate-x-2 transition-transform cursor-pointer">
                  Learn More <ChevronRight size={14} className="ml-2" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Layer */}
      <section id="services" className="py-44 bg-slate-950 relative overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div>
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-10">Architectural Evolution</h2>
              <h3 className="text-[3.5rem] md:text-[4.5rem] font-black text-white leading-[0.9] mb-12 tracking-tighter">
                Empowering <br />
                Educational <span className="text-primary italic">Excellence.</span>
              </h3>
              <div className="space-y-12">
                 {[
                   { title: 'Digital Enrollment', text: 'Seamless onboarding via verified student data and secure system procedures.' },
                   { title: 'Smart Analytics', text: 'Real-time data insights for detailed school performance reporting.' },
                   { title: 'Seamless Communication', text: 'Bridging the communication gap between schools and parents in real-time.' }
                 ].map((item, i) => (
                   <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    key={i} 
                    className="flex space-x-8 group"
                   >
                     <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all group-hover:border-primary/20">
                       <ChevronRight className="text-primary" size={24} />
                     </div>
                     <div>
                       <h4 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">{item.title}</h4>
                       <p className="text-slate-400 leading-relaxed font-bold text-sm tracking-tight">{item.text}</p>
                     </div>
                   </motion.div>
                 ))}
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-16 border border-white/5 shadow-[0_50px_100px_-50px_rgba(0,0,0,0.8)] relative group overflow-hidden"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:opacity-100 transition-opacity" />

              <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-12 border border-primary/20">
                <BookOpen className="text-primary" size={44} />
              </div>
              <h4 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase italic">Transform Your School</h4>
              <p className="text-slate-400 text-lg mb-16 leading-relaxed font-medium">
                "School management should be simple, efficient, and integrated. Join the educational revolution today."
              </p>
              <Link 
                to="/register" 
                className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-2xl active:scale-95 group"
              >
                Register Your School
                <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform" size={24} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Layer */}
      <footer className="bg-canvas pt-32 pb-16 border-t border-border-muted">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-32">
            <div className="md:col-span-4">
              <div className="flex items-center space-x-3 mb-10 group">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <GraduationCap className="text-white" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tighter text-on-surface uppercase italic">SaaSLink</span>
                  <span className="text-[8px] font-bold text-primary uppercase tracking-[0.4em] -mt-1">Management</span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed font-bold text-sm mb-12 max-w-sm tracking-tight">
                The foundation of modern school management. Providing specialized tools for educational excellence.
              </p>
              <div className="flex space-x-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-2xl bg-surface border border-border-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm group active:scale-90" />
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h5 className="font-black text-on-surface mb-10 uppercase text-[10px] tracking-[0.3em]">Services</h5>
              <ul className="space-y-5 text-slate-500 font-bold text-sm tracking-tight">
                {['Analytics', 'Solutions', 'Pricing', 'Documentation'].map(item => (
                   <li key={item}><a href="#" className="hover:text-primary transition-all">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-black text-on-surface mb-10 uppercase text-[10px] tracking-[0.3em]">School Center</h5>
              <ul className="space-y-5 text-slate-500 font-bold text-sm tracking-tight">
                {['News', 'Support', 'Security', 'Features'].map(item => (
                   <li key={item}><a href="#" className="hover:text-primary transition-all">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4">
              <h5 className="font-black text-on-surface mb-10 uppercase text-[10px] tracking-[0.3em]">Stay Updated</h5>
              <p className="text-slate-400 font-bold text-sm mb-8 tracking-tight italic">Receive school management insights directly in your inbox.</p>
              <div className="flex bg-surface border border-border-muted p-2 rounded-[1.5rem] shadow-inner">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="bg-transparent px-5 py-3 w-full font-bold focus:outline-none text-sm"
                />
                <button className="bg-slate-900 dark:bg-primary text-white p-4 rounded-2xl shadow-xl hover:scale-105 transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border-muted pt-16 flex flex-col md:row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <p className="mb-8 md:mb-0">© 2026 SaaSLink School Management. All systems operational.</p>
            <div className="flex space-x-12">
               <Link to="/terms" className="hover:text-primary transition-all">Terms of Service</Link>
               <Link to="/privacy" className="hover:text-primary transition-all">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
