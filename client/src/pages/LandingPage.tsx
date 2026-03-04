import { 
  ArrowRight, 
  Users, 
  CreditCard, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  Globe,
  Search,
  Layout,
  Code,
  Cloud,
  Sun,
  Lock,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const features = [
    {
      icon: <Search className="w-6 h-6 text-brand-sand" />,
      title: "Student & Staff Analytics",
      description: "Before a single record is created, we translate your institutional goals into technical blueprints. This includes requirement gathering and scalability planning."
    },
    {
      icon: <Layout className="w-6 h-6 text-brand-sand" />,
      title: "Strategic UX/UI Design",
      description: "We design intuitive interfaces that reduce user friction and increase adoption. Our design process focuses on brand alignment and accessibility."
    },
    {
      icon: <Code className="w-6 h-6 text-brand-sand" />,
      title: "Custom Academic Logic",
      description: "From sophisticated grading systems to complex timetable engines, we build robust, high-performance software tailored to your specific workflow."
    },
    {
      icon: <Cloud className="w-6 h-6 text-brand-sand" />,
      title: "Cloud Infrastructure & DevOps",
      description: "We deploy on world-class cloud environments with automated pipelines. Our DevOps focus ensures your software remains fast and responsive."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-green text-brand-white font-sans selection:bg-brand-sand selection:text-brand-dark">
      {/* Navigation */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl">
        <nav className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-sand rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-brand-dark font-bold text-xl">S</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight">SaaSLink</span>
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">OS V3.0</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-8 text-[11px] font-bold uppercase tracking-widest opacity-80">
            <a href="#capability" className="hover:text-brand-sand transition-colors">Capability</a>
            <a href="#services" className="hover:text-brand-sand transition-colors">Services</a>
            <a href="#solutions" className="hover:text-brand-sand transition-colors">Solutions</a>
            <a href="#insights" className="hover:text-brand-sand transition-colors">Insights</a>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Sun className="w-4 h-4" />
            </button>
            <Link to="/login" className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
              <Lock className="w-3 h-3" />
              <span>Access Portal</span>
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-brand-sand text-brand-dark rounded-xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center space-x-2 shadow-lg shadow-brand-sand/20">
              <span>Deploy</span>
              <Zap className="w-3 h-3 fill-current" />
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <main className="pt-48 pb-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-brand-sand text-[11px] font-bold uppercase tracking-[0.3em] mb-6 block">
              The Enterprise Partner
            </span>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-10">
              What We Do:<br />
              <span className="text-brand-sand italic font-serif">Engineering</span><br />
              the Digital Core
            </h1>
            <p className="text-lg text-brand-white/60 leading-relaxed mb-12 max-w-lg">
              Software development at SaaSLink is more than writing code—it is the engineering of business value. We act as a strategic technology arm, helping organizations move from legacy constraints to autonomous, cloud-native futures.
            </p>
            <Link to="/register" className="inline-flex items-center space-x-3 text-brand-sand text-[11px] font-bold uppercase tracking-widest group">
              <span>Download Engineering Protocol</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-8 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 leading-tight">{feature.title}</h3>
                <p className="text-sm text-brand-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer / Bottom Bar */}
      <footer className="py-12 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
          <div>© 2026 SaaSLink Technologies. All rights reserved.</div>
          <div className="flex space-x-8 mt-6 md:mt-0">
            <a href="#" className="hover:text-brand-sand transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-sand transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-sand transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
