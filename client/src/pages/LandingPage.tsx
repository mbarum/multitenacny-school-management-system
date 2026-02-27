import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#0A0A0A] font-sans">
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-6 lg:p-8 bg-white/30 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <motion.div 
            className="w-8 h-8 bg-black rounded-full"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
          />
          <span className="text-xl font-semibold tracking-tight">SaasLink EMIS</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="hover:text-opacity-70 transition-opacity">Features</a>
          <Link to="/pricing" className="hover:text-opacity-70 transition-opacity">Pricing</Link>
          <a href="#contact" className="hover:text-opacity-70 transition-opacity">Contact</a>
        </nav>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="hover:text-opacity-70 transition-opacity">Sign In</Link>
          <Link to="/register" className="px-6 py-2 bg-black text-white rounded-full hover:bg-opacity-80 transition-colors flex items-center">
            Get Started
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight md:leading-none">
              The Modern Operating System
              <br />
              <span className="text-black/50">for African Schools</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-black/60">
              SaasLink EMIS provides a unified platform to manage academics, finances, communication, and operations, empowering educators and administrators across East Africa.
            </p>
            <div className="mt-8 flex justify-center items-center gap-4">
              <Link to="/register" className="px-8 py-4 bg-black text-white rounded-full hover:bg-opacity-80 transition-colors flex items-center text-lg">
                Request a Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/contact" className="px-8 py-4 border border-black/10 rounded-full hover:bg-black/5 transition-colors text-lg">
                Contact Sales
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="mt-24 rounded-2xl bg-white shadow-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          >
            <img src="https://picsum.photos/seed/school-dashboard/1200/800" alt="School Dashboard Illustration" className="w-full h-auto" referrerPolicy="no-referrer" />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
