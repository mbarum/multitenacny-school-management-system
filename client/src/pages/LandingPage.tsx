import { 
  ArrowRight, 
  Users, 
  CreditCard, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  Globe,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Zap,
  ChevronRight,
  Shield,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const benefits = [
    {
      icon: <GraduationCap className="w-6 h-6 text-brand-sand" />,
      title: "Academic Excellence",
      description: "Empower educators with robust grading and curriculum tools designed for the next generation."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-brand-sand" />,
      title: "Fintech Precision",
      description: "Automated fee collection and revenue tracking with institutional-grade financial reporting."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-brand-sand" />,
      title: "Seamless Engagement",
      description: "Bridge the gap between home and school with real-time communications and insights."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-sand" />,
      title: "Secure Infrastructure",
      description: "Enterprise-level data protection and compliance, ensuring yours and your students' safety."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1D1D1F] font-sans selection:bg-brand-sand selection:text-brand-dark overflow-x-hidden">
      {/* Premium Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-black/[0.03]">
        <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-brand-green rounded-[10px] flex items-center justify-center shadow-lg shadow-brand-green/10">
              <span className="text-brand-sand font-black text-lg">S</span>
            </div>
            <span className="text-xl font-black tracking-tight text-brand-green uppercase">SaaSLink</span>
          </div>

          <div className="hidden lg:flex items-center space-x-10 text-[13px] font-bold uppercase tracking-[0.1em] text-brand-green/60">
            <a href="#features" className="hover:text-brand-green transition-all">Platform</a>
            <Link to="/pricing" className="hover:text-brand-green transition-all">Pricing</Link>
            <a href="#about" className="hover:text-brand-green transition-all">Company</a>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="text-xs font-black uppercase tracking-[0.1em] text-brand-green/80 hover:text-brand-green transition-all">
              Sign In
            </Link>
            <Link to="/register" className="px-7 py-3 bg-brand-green text-brand-sand rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-brand-green-light transition-all shadow-xl shadow-brand-green/20 active:scale-95">
              Launch EMIS
            </Link>
          </div>
        </div>
      </nav>

      {/* World-Class Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-0 lg:pb-0 lg:h-screen lg:min-h-[800px] flex items-center overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8 w-full">
          <div className="lg:grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="z-10"
            >
              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-brand-sand/15 rounded-full text-brand-green text-[10px] font-black uppercase tracking-[0.2em] mb-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-sand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-sand"></span>
                </span>
                <span>The Gold Standard for Modern Schools</span>
              </div>
              
              <h1 className="text-[72px] lg:text-[100px] font-bold tracking-tight leading-[0.88] mb-10 text-brand-green">
                Design <br />
                <span className="text-brand-sand font-serif italic font-normal tracking-wide">Excellence</span> <br />
                for Education.
              </h1>
              
              <p className="text-xl text-brand-green/60 leading-relaxed mb-12 max-w-lg font-medium">
                SaaSLink EMIS isn't just software—it's a mission-control instrument for your institution. Experience precision at scale.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <Link to="/register" className="px-10 py-6 bg-brand-green text-brand-sand rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all flex items-center justify-center shadow-2xl shadow-brand-green/20 group">
                  Start Free Deployment <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-10 py-6 bg-white border border-brand-green/10 text-brand-green rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-green/5 transition-all flex items-center justify-center">
                  <PlayCircle className="mr-3 w-4 h-4" /> System Demo
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="mt-20 lg:mt-0 relative group"
            >
              <div className="absolute -inset-20 bg-brand-sand/20 blur-[120px] rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative rounded-[48px] border-[16px] border-white shadow-[0_40px_80px_-20px_rgba(4,45,45,0.2)] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200&h=900" 
                  alt="System Preview" 
                  className="w-full h-auto scale-105 group-hover:scale-100 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating UI Elements */}
                <div className="absolute top-10 right-10 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-black/5 max-w-[200px]">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center">
                      <Users size={18} className="text-brand-green" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest leading-none">Enrollment</span>
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-brand-green">+240%</div>
                  <div className="text-[10px] font-bold text-brand-sand uppercase tracking-wider mt-1">Institutional Growth</div>
                </div>

                <div className="absolute bottom-10 left-10 bg-brand-green p-7 rounded-[32px] shadow-2xl text-brand-sand">
                  <div className="flex items-center space-x-4">
                    <Sparkles size={24} />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Financial State</div>
                      <div className="text-xl font-bold tracking-tight leading-none uppercase">Balanced.</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Strategic Grid Section */}
      <section id="features" className="py-40 bg-white relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-10">
            <div className="max-w-2xl">
              <h2 className="text-[40px] lg:text-[60px] font-bold tracking-tight text-brand-green leading-[1.1] mb-8">
                Designed for the <br />
                <span className="text-brand-sand italic font-serif font-normal">Modern Institution.</span>
              </h2>
              <p className="text-xl text-brand-green/60 font-medium">
                We've combined technical rigor with human-centric design to eliminate the administrative friction that holds schools back.
              </p>
            </div>
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-brand-green/5 border border-brand-green/10 rounded-full flex items-center justify-center text-brand-green">
                  <ChevronRight size={20} />
               </div>
               <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-green/40">Explore our ecosystem</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="group flex flex-col items-start">
                <div className="w-16 h-16 bg-brand-green/5 rounded-[24px] flex items-center justify-center mb-10 group-hover:bg-brand-green group-hover:scale-110 transition-all duration-500 shadow-xl shadow-brand-green/5 group-hover:shadow-brand-green/20">
                  <div className="text-brand-green group-hover:text-brand-sand transition-colors">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-brand-green mb-5 tracking-tight">{benefit.title}</h3>
                <p className="text-[15px] font-medium text-brand-green/40 leading-relaxed max-w-[240px]">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-green/[0.02] border-l border-brand-green/5 -skew-x-12 transform translate-x-1/2" />
      </section>

      {/* Confident "Impact" Section */}
      <section className="py-40 bg-brand-green text-brand-sand relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 gap-32 items-center">
             <div className="mb-20 lg:mb-0">
                <div className="text-[100px] font-bold tracking-tighter opacity-10 leading-none mb-10">Deploy.</div>
                <h2 className="text-[50px] lg:text-[72px] font-bold tracking-tight leading-[1] mb-12">
                   Migration <br /> Is Over in a <br /> 
                   <span className="italic font-serif font-normal">Single Day.</span>
                </h2>
                
                <div className="space-y-12">
                   {[
                     { step: "01", title: "Automated Data Ingest", text: "Import thousands of records via our smart verification engine." },
                     { step: "02", title: "Parameter Mapping", text: "Configure grading and financial rules with logic-driven presets." },
                     { step: "03", title: "Live Provisioning", text: "Deploy your dedicated infrastructure and onboard staff instantly." }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-8 group">
                        <span className="text-[40px] font-black opacity-20 group-hover:opacity-100 transition-opacity duration-500 leading-none">{item.step}</span>
                        <div>
                           <h4 className="text-2xl font-bold mb-3 tracking-tight">{item.title}</h4>
                           <p className="text-brand-sand/60 font-medium leading-relaxed max-w-sm">{item.text}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="relative">
                <div className="absolute -inset-20 bg-white/5 blur-[100px] rounded-full" />
                <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[64px] p-16 shadow-2xl">
                   <div className="flex justify-center mb-12">
                      <div className="w-24 h-24 bg-brand-sand text-brand-dark rounded-full flex items-center justify-center">
                         <Shield size={40} />
                      </div>
                   </div>
                   <div className="text-center mb-16">
                      <h3 className="text-3xl font-black uppercase tracking-[0.2em] mb-4">Enterprise Grade</h3>
                      <p className="text-brand-sand/60 font-medium italic font-serif">Trust is our primary architecture.</p>
                   </div>
                   <div className="grid grid-cols-1 gap-6">
                     {[
                       "Infinite data redundancy",
                       "256-bit automated encryption",
                       "M-Pesa Real-time reconciliation",
                       "Dedicated East Africa support"
                     ].map((check, i) => (
                        <div key={i} className="flex items-center space-x-5 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                           <CheckCircle2 className="text-brand-sand group-hover:scale-110 transition-transform" />
                           <span className="font-bold tracking-tight uppercase text-xs opacity-80">{check}</span>
                        </div>
                     ))}
                   </div>
                   <Link to="/register" className="mt-16 w-full py-7 bg-brand-sand text-brand-dark rounded-[32px] font-black uppercase tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-brand-sand/10 flex items-center justify-center">
                      Onboard School Now
                   </Link>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Refined Footer */}
      <footer className="py-32 bg-[#FBFBFA] border-t border-black/[0.03]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid lg:grid-cols-4 gap-16 lg:gap-8 mb-24">
             <div className="col-span-2">
                <div className="flex items-center space-x-2 mb-8">
                  <div className="w-9 h-9 bg-brand-green rounded-[10px] flex items-center justify-center">
                    <span className="text-brand-sand font-black text-lg">S</span>
                  </div>
                  <span className="text-xl font-black tracking-tight text-brand-green uppercase">SaaSLink</span>
                </div>
                <p className="text-lg text-brand-green/40 font-medium max-w-sm leading-relaxed mb-10">
                  Architecting the future of African education management. Precision, scale, and trust embedded in every line of code.
                </p>
                <div className="flex space-x-10">
                   <a href="#" className="w-5 h-5 bg-brand-green/10 rounded-full hover:bg-brand-green transition-colors" />
                   <a href="#" className="w-5 h-5 bg-brand-green/10 rounded-full hover:bg-brand-green transition-colors" />
                   <a href="#" className="w-5 h-5 bg-brand-green/10 rounded-full hover:bg-brand-green transition-colors" />
                </div>
             </div>
             
             <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green/40 mb-10">Product</h5>
                <div className="flex flex-col space-y-6 text-[13px] font-bold uppercase tracking-widest text-brand-green/60">
                   <a href="#" className="hover:text-brand-green">Platform</a>
                   <a href="#" className="hover:text-brand-green">Infrastructure</a>
                   <a href="#" className="hover:text-brand-green">Pricing</a>
                </div>
             </div>

             <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green/40 mb-10">Resource</h5>
                <div className="flex flex-col space-y-6 text-[13px] font-bold uppercase tracking-widest text-brand-green/60">
                   <a href="#" className="hover:text-brand-green">Privacy & Legal</a>
                   <a href="#" className="hover:text-brand-green">Terms of Service</a>
                   <a href="#" className="hover:text-brand-green">Support Center</a>
                </div>
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center py-12 border-t border-black/[0.03] gap-8">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green/20">
              © 2026 SaaSLink Technologies Limited. All Rights Reserved.
            </div>
            <div className="flex space-x-10 text-[10px] font-black uppercase tracking-[0.3em] text-brand-green/20">
               <span>KES (Kenya)</span>
               <span>English</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
