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
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const benefits = [
    {
      icon: <GraduationCap className="w-6 h-6 text-brand-sand" />,
      title: "Academic Excellence",
      description: "Streamline grading, report cards, and curriculum tracking so teachers can focus on teaching."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-brand-sand" />,
      title: "Financial Clarity",
      description: "Automated fee collection via M-Pesa and Stripe. Real-time financial health at your fingertips."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-brand-sand" />,
      title: "Parent Engagement",
      description: "Keep parents informed with instant notifications on attendance, grades, and school events."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-sand" />,
      title: "Data Security",
      description: "Enterprise-grade protection for student records and institutional data, compliant with local laws."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-white text-brand-dark font-sans selection:bg-brand-sand selection:text-brand-dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-white/80 backdrop-blur-xl border-b border-brand-green/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-brand-sand font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-green">SaaSLink</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-brand-green/70">
            <a href="#features" className="hover:text-brand-green transition-colors">Features</a>
            <Link to="/pricing" className="hover:text-brand-green transition-colors">Pricing</Link>
            <a href="#about" className="hover:text-brand-green transition-colors">About</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-bold text-brand-green hover:opacity-70 transition-opacity">
              Sign In
            </Link>
            <Link to="/register" className="px-6 py-3 bg-brand-green text-brand-white rounded-full text-sm font-bold hover:bg-brand-green-light transition-all shadow-lg shadow-brand-green/10">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 bg-gradient-to-b from-brand-green/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-sand/10 rounded-full text-brand-green text-xs font-bold uppercase tracking-widest mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-sand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-sand"></span>
                </span>
                <span>Trusted by 500+ Schools</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-8 text-brand-green">
                The Complete <br />
                <span className="text-brand-sand italic font-serif">Operating System</span> <br />
                for Your School.
              </h1>
              <p className="text-xl text-brand-green/70 leading-relaxed mb-10 max-w-lg">
                SaaSLink EMIS simplifies every aspect of school management. From enrollment to graduation, we provide the tools you need to run a world-class institution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="px-10 py-5 bg-brand-green text-brand-white rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center shadow-xl shadow-brand-green/20">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button className="px-10 py-5 border-2 border-brand-green/10 rounded-full font-bold text-lg hover:bg-brand-green/5 transition-colors flex items-center justify-center">
                  <PlayCircle className="mr-2 w-5 h-5" /> Watch Demo
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-brand-sand/20 blur-3xl rounded-[40px] -z-10" />
              <div className="rounded-3xl border-8 border-brand-green/5 shadow-2xl overflow-hidden bg-white">
                <img 
                  src="https://picsum.photos/seed/school-app/1200/800" 
                  alt="SaaSLink Dashboard Preview" 
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-brand-green/5 hidden md:block">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-brand-sand/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-brand-green">Fee Collection</div>
                    <div className="text-2xl font-bold text-brand-green">94%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section id="features" className="py-32 bg-brand-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-green mb-6">Built for the modern educator.</h2>
            <p className="text-lg text-brand-green/60">We've spent years working with school administrators to build a platform that actually solves your daily headaches.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="p-8 rounded-[32px] bg-brand-green/5 border border-brand-green/5 hover:bg-brand-green/10 transition-all group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-brand-green mb-4">{benefit.title}</h3>
                <p className="text-sm text-brand-green/60 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Easy" Section */}
      <section className="py-32 bg-brand-green text-brand-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-bold tracking-tight mb-8">Switching is easier than you think.</h2>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-brand-sand text-brand-dark rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Import Your Data</h4>
                    <p className="text-brand-white/60">Upload your existing student and staff records via Excel. Our team helps you migrate everything for free.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-brand-sand text-brand-dark rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Configure Your Rules</h4>
                    <p className="text-brand-white/60">Set up your grading scales, fee structures, and timetable requirements in minutes.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-brand-sand text-brand-dark rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Launch & Automate</h4>
                    <p className="text-brand-white/60">Invite staff and parents. Start collecting fees and tracking attendance automatically.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-brand-sand/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] blur-3xl" />
              <div className="relative bg-brand-white/5 border border-brand-white/10 rounded-[40px] p-12 backdrop-blur-sm">
                <div className="text-center mb-8">
                  <div className="text-brand-sand text-sm font-bold uppercase tracking-widest mb-2">Ready to start?</div>
                  <div className="text-3xl font-bold italic font-serif">Join the community.</div>
                </div>
                <div className="space-y-4">
                  {[
                    "No credit card required for trial",
                    "Free data migration support",
                    "24/7 Local support in East Africa",
                    "M-Pesa integration ready"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-sand" />
                      <span className="text-brand-white/80 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/register" className="mt-10 w-full py-5 bg-brand-sand text-brand-dark rounded-2xl font-bold text-lg hover:brightness-110 transition-all flex items-center justify-center">
                  Create Your Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-brand-white border-t border-brand-green/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
                <span className="text-brand-sand font-bold">S</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-brand-green">SaaSLink</span>
            </div>
            <div className="flex space-x-8 text-sm font-bold uppercase tracking-widest text-brand-green/40">
              <Link to="/privacy" className="hover:text-brand-green transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-brand-green transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-brand-green transition-colors">Contact</Link>
            </div>
            <div className="text-sm text-brand-green/40">
              © 2026 SaaSLink Technologies.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
