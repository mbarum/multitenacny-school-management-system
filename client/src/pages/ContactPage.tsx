import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactPage: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    // Simulate API call
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <div className="min-h-screen bg-brand-white text-brand-dark font-sans selection:bg-brand-sand selection:text-brand-dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-white/80 backdrop-blur-xl border-b border-brand-green/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <ArrowLeft className="text-brand-sand w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-green">Back to Home</span>
          </Link>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20">
            {/* Left Column: Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-sand/10 rounded-full text-brand-green text-xs font-bold uppercase tracking-widest mb-8">
                <MessageSquare className="w-4 h-4" />
                <span>Get in Touch</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-none mb-8 text-brand-green">
                Let's <span className="text-brand-sand italic font-serif">Connect.</span>
              </h1>
              <p className="text-xl text-brand-green/60 leading-relaxed mb-12 max-w-lg">
                Whether you're looking for a demo, technical support, or have a legal inquiry, our team is ready to assist you.
              </p>

              <div className="space-y-8">
                <div className="flex items-center space-x-6 group">
                  <div className="w-14 h-14 bg-brand-green/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-green group-hover:text-brand-sand transition-all">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 mb-1">Email Us</div>
                    <div className="text-lg font-bold text-brand-green">support@saaslink.tech</div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 group">
                  <div className="w-14 h-14 bg-brand-green/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-green group-hover:text-brand-sand transition-all">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 mb-1">Call Us</div>
                    <div className="text-lg font-bold text-brand-green">+254 700 000 000</div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 group">
                  <div className="w-14 h-14 bg-brand-green/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-green group-hover:text-brand-sand transition-all">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 mb-1">Visit Us</div>
                    <div className="text-lg font-bold text-brand-green">Nairobi, Kenya</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-brand-sand/10 blur-3xl rounded-[40px] -z-10" />
              <div className="bg-white border border-brand-green/5 rounded-[40px] p-10 shadow-2xl">
                {formState === 'success' ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-brand-sand/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-brand-green" />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-green mb-2">Message Received!</h3>
                    <p className="text-brand-green/60">We'll get back to you within 24 hours.</p>
                    <button 
                      onClick={() => setFormState('idle')}
                      className="mt-8 text-brand-green font-bold hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 ml-1">Full Name</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-6 py-4 bg-brand-green/5 border border-transparent rounded-2xl focus:outline-none focus:border-brand-sand transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 ml-1">Email Address</label>
                        <input 
                          type="email" 
                          required
                          className="w-full px-6 py-4 bg-brand-green/5 border border-transparent rounded-2xl focus:outline-none focus:border-brand-sand transition-colors"
                          placeholder="john@school.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 ml-1">Institution Name</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-brand-green/5 border border-transparent rounded-2xl focus:outline-none focus:border-brand-sand transition-colors"
                        placeholder="St. Andrews Academy"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 ml-1">Message</label>
                      <textarea 
                        required
                        rows={4}
                        className="w-full px-6 py-4 bg-brand-green/5 border border-transparent rounded-2xl focus:outline-none focus:border-brand-sand transition-colors resize-none"
                        placeholder="How can we help you?"
                      ></textarea>
                    </div>
                    <button 
                      type="submit"
                      disabled={formState === 'submitting'}
                      className="w-full py-5 bg-brand-green text-brand-white rounded-2xl font-bold text-lg hover:brightness-110 transition-all flex items-center justify-center shadow-xl shadow-brand-green/20 disabled:opacity-50"
                    >
                      {formState === 'submitting' ? 'Sending...' : (
                        <>
                          Send Message <Send className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-brand-white border-t border-brand-green/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm text-brand-green/40">© 2026 SaaSLink Technologies Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
