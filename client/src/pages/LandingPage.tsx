import { 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  CreditCard, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  Globe,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Student & Staff Management",
      description: "Comprehensive profiles, attendance tracking, and performance monitoring for everyone in your school."
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Financial Operations",
      description: "Automated fee collection with M-Pesa and Stripe integration, financial reporting, and expense management."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart Timetabling",
      description: "Intelligent scheduling for classes, exams, and extracurricular activities without conflicts."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Reporting",
      description: "Generate detailed report cards, financial summaries, and institutional analytics with one click."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with role-based access control and data protection for sensitive information."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-Tenancy",
      description: "Built for scale. Manage multiple campuses or an entire school district from a single dashboard."
    }
  ];

  const testimonials = [
    {
      quote: "SaaSLink has transformed how we manage our school. The financial reporting alone has saved us hours of manual work every week.",
      author: "Dr. Jane Kamau",
      role: "Principal, Nairobi Academy"
    },
    {
      quote: "The best EMIS we've used. It's intuitive, fast, and the M-Pesa integration makes fee collection seamless for parents.",
      author: "Samuel Okoro",
      role: "Administrator, Lagos International School"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFC] text-[#0A0A0A] font-sans selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-black/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm" />
            </div>
            <span className="text-xl font-bold tracking-tight">SaaSLink</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-black/60 transition-colors">Features</a>
            <Link to="/pricing" className="text-sm font-medium hover:text-black/60 transition-colors">Pricing</Link>
            <a href="#about" className="text-sm font-medium hover:text-black/60 transition-colors">About</a>
            <div className="h-4 w-px bg-black/10 mx-2" />
            <Link to="/login" className="text-sm font-medium hover:text-black/60 transition-colors">Sign In</Link>
            <Link to="/register" className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-black/80 transition-all active:scale-95">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col space-y-6 text-center">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-2xl font-semibold">Features</a>
              <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="text-2xl font-semibold">Pricing</Link>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-2xl font-semibold">Sign In</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="px-8 py-4 bg-black text-white rounded-full text-xl font-bold">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 bg-black/5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                The Future of School Management
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] mb-8">
                Run your school <br />
                <span className="text-black/30 italic font-serif">with precision.</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-black/60 leading-relaxed mb-10">
                A unified operating system for African schools. Manage academics, finances, and operations in one elegant platform.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:bg-black/80 transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/pricing" className="w-full sm:w-auto px-10 py-5 border border-black/10 rounded-full font-bold text-lg hover:bg-black/5 transition-all flex items-center justify-center">
                  View Pricing
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Hero Image / Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-b from-black/5 to-transparent blur-3xl rounded-[40px] -z-10" />
            <div className="rounded-2xl border border-black/5 shadow-2xl overflow-hidden bg-white">
              <img 
                src="https://picsum.photos/seed/dashboard-v2/2400/1600" 
                alt="SaaSLink Dashboard" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-orange-100 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-sm text-black/50 font-medium uppercase tracking-wider">Schools</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">200k+</div>
              <div className="text-sm text-black/50 font-medium uppercase tracking-wider">Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15+</div>
              <div className="text-sm text-black/50 font-medium uppercase tracking-wider">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-sm text-black/50 font-medium uppercase tracking-wider">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-20 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Built for the modern educator.</h2>
            <p className="text-lg text-black/60">Everything you need to manage your institution, from enrollment to graduation, in one integrated system.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-white border border-black/5 hover:border-black/10 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-black/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8">Trusted by leading institutions.</h2>
              <div className="flex space-x-4">
                <div className="px-4 py-2 border border-white/20 rounded-full text-sm font-medium">Nairobi</div>
                <div className="px-4 py-2 border border-white/20 rounded-full text-sm font-medium">Lagos</div>
                <div className="px-4 py-2 border border-white/20 rounded-full text-sm font-medium">Accra</div>
                <div className="px-4 py-2 border border-white/20 rounded-full text-sm font-medium">Kigali</div>
              </div>
            </div>
            <div className="space-y-8">
              {testimonials.map((t, idx) => (
                <div key={idx} className="p-8 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xl italic mb-6">"{t.quote}"</p>
                  <div>
                    <div className="font-bold">{t.author}</div>
                    <div className="text-sm text-white/50">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="rounded-[40px] bg-[#F5F5F4] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">Ready to upgrade your school?</h2>
              <p className="max-w-xl mx-auto text-lg text-black/60 mb-12">Join hundreds of schools already using SaaSLink to streamline their operations and improve student outcomes.</p>
              <Link to="/register" className="inline-flex items-center px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            {/* Abstract shapes for CTA */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-black/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <div className="w-3 h-3 border border-white rounded-sm" />
                </div>
                <span className="text-lg font-bold tracking-tight">SaaSLink</span>
              </div>
              <p className="text-sm text-black/50 leading-relaxed">The modern operating system for African schools. Built with love in Nairobi.</p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-black/60">
                <li><a href="#" className="hover:text-black">Features</a></li>
                <li><a href="#" className="hover:text-black">Pricing</a></li>
                <li><a href="#" className="hover:text-black">API</a></li>
                <li><a href="#" className="hover:text-black">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-black/60">
                <li><a href="#" className="hover:text-black">About</a></li>
                <li><a href="#" className="hover:text-black">Blog</a></li>
                <li><a href="#" className="hover:text-black">Careers</a></li>
                <li><a href="#" className="hover:text-black">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-black/60">
                <li><a href="#" className="hover:text-black">Privacy</a></li>
                <li><a href="#" className="hover:text-black">Terms</a></li>
                <li><a href="#" className="hover:text-black">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:row items-center justify-between pt-12 border-t border-black/5 text-xs text-black/40 font-medium uppercase tracking-widest">
            <div>© 2026 SaaSLink Technologies. All rights reserved.</div>
            <div className="mt-4 md:mt-0 flex space-x-8">
              <a href="#" className="hover:text-black">Twitter</a>
              <a href="#" className="hover:text-black">LinkedIn</a>
              <a href="#" className="hover:text-black">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
