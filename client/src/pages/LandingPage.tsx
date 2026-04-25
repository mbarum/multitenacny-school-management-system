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
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-500 font-sans">
      {/* Header */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EduStream</span>
          </div>

          <div className="hidden lg:flex items-center space-x-10 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
            <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-50 text-slate-500 transition-all"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link to="/login" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="bg-primary text-white px-6 py-2.5 text-sm font-bold rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
            <button className="lg:hidden p-2 text-slate-600">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8">
                <span className="mr-2">New:</span> Academic Performance Tracking v2.0
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                Modern Education <br />
                <span className="text-primary">Management</span> Simplified.
              </h1>
              
              <p className="text-lg text-slate-600 mb-12 leading-relaxed max-w-xl">
                The most intuitive platform for school administrators, teachers, and parents. 
                Streamline admissions, finances, and learning management in one unified space.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="flex items-center justify-center bg-primary text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-xl shadow-primary/20"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2" size={20} />
                </Link>
                <Link 
                  to="/login"
                  className="flex items-center justify-center bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold transition-all hover:bg-slate-50 shadow-sm"
                >
                  Schedule a Demo
                </Link>
              </div>

              <div className="mt-12 flex items-center space-x-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Trusted by <span className="text-slate-900 font-bold">500+ Institutions</span> worldwide
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-2">
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
                  alt="Dashboard Preview" 
                  className="rounded-xl"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary/90 text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                  <Activity size={32} />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-50 flex items-center space-x-4 max-w-xs">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">89% Efficiency</p>
                  <p className="text-xs text-slate-500">In administrative tasks</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-base font-bold text-primary uppercase tracking-widest mb-4">Core Ecosystem</h2>
            <h3 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Everything your institution needs</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              We've built the complete toolkit for modern academic success. Professional tools, simplified for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Users className="text-primary" size={32} />,
                title: "Student Admissions",
                text: "Automated end-to-end registration and document management for all applicants."
              },
              {
                icon: <BarChart3 className="text-primary" size={32} />,
                title: "Financial Control",
                text: "Comprehensive fee management, invoicing, and real-time payment tracking."
              },
              {
                icon: <Layout className="text-primary" size={32} />,
                title: "Academic Operations",
                text: "Effortless timetabling, exam scheduling, and results processing."
              },
              {
                icon: <Globe className="text-primary" size={32} />,
                title: "LMS Integration",
                text: "A unified platform for digital learning, assignment submission, and grading."
              },
              {
                icon: <ShieldCheck className="text-primary" size={32} />,
                title: "Secure Data",
                text: "Enterprise-grade encryption and isolated data storage for every institution."
              },
              {
                icon: <Clock className="text-primary" size={32} />,
                title: "Smart Attendance",
                text: "Real-time tracking for students and staff with automated parent notifications."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-10 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions / CTAs */}
      <section id="solutions" className="py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-base font-bold text-primary uppercase tracking-widest mb-8">Digital Transformation</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-10 tracking-tight">
                Designed for the next <br />
                generation of learners.
              </h3>
              <div className="space-y-8">
                 {[
                   { title: 'Mobile-First Registration', text: 'Parents can register students directly from their smartphones in under 5 minutes.' },
                   { title: 'Instant Analytics', text: 'Get real-time insights into institutional performance and financial health.' },
                   { title: 'Unified Communications', text: 'Bridge the gap between teachers, parents, and administrators.' }
                 ].map((item, i) => (
                   <div key={i} className="flex space-x-6">
                     <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                       <ChevronRight className="text-primary" size={20} />
                     </div>
                     <div>
                       <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                       <p className="text-slate-400 leading-relaxed font-medium">{item.text}</p>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-3xl p-12 border border-slate-700 shadow-2xl">
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-10">
                <BookOpen className="text-primary" size={40} />
              </div>
              <h4 className="text-3xl font-bold text-white mb-6">Join the Community</h4>
              <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                Ready to transform your institution? Join hundreds of schools that have improved efficiency by over 60%.
              </p>
              <Link 
                to="/register" 
                className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all flex items-center justify-center shadow-xl shadow-primary/20"
              >
                Register Your School Now
                <ArrowRight className="ml-3" size={24} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-[40px] -z-10" />
              <img 
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop" 
                alt="About EduStream" 
                className="rounded-[2.5rem] shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary uppercase tracking-widest mb-6">Our Mission</h2>
              <h3 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">Pioneering the future of <span className="text-primary italic">academic infrastructure.</span></h3>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                EduStream was born out of a simple observation: educational institutions were being held back by fragmented, legacy softeware. We built a unified ecosystem that puts data-driven decision making in the hands of educators.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-3xl font-bold text-slate-900 mb-2">10M+</h4>
                  <p className="text-sm text-slate-500 font-medium italic">Student Records Managed</p>
                </div>
                <div>
                  <h4 className="text-3xl font-bold text-slate-900 mb-2">15+</h4>
                  <p className="text-sm text-slate-500 font-medium italic">Countries Impacted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">EduStream</span>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium mb-8">
                Empowering institutions with precision tools for modern education management.
              </p>
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer" />
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-slate-900 mb-8 uppercase text-sm tracking-widest">Platform</h5>
              <ul className="space-y-4 text-slate-500 font-medium">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#solutions" className="hover:text-primary transition-colors">Solutions</a></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-8 uppercase text-sm tracking-widest">Company</h5>
              <ul className="space-y-4 text-slate-500 font-medium">
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-8 uppercase text-sm tracking-widest">Newsletter</h5>
              <p className="text-slate-500 font-medium mb-6">Stay updated with the latest in education technology.</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-l-xl w-full focus:outline-none focus:border-primary transition-colors"
                />
                <button className="bg-primary text-white p-3 rounded-r-xl">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-12 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm font-medium">
            <p>© 2026 EduStream Management Systems. All rights reserved.</p>
            <div className="flex space-x-8 mt-6 md:mt-0">
               <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
               <Link to="/privacy" className="hover:text-primary">Cookie Settings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
