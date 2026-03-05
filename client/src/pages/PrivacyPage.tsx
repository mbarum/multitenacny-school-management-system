import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
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
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-sand/10 rounded-full text-brand-green text-xs font-bold uppercase tracking-widest mb-8">
              <Shield className="w-4 h-4" />
              <span>Privacy Commitment</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-none mb-12 text-brand-green">
              Privacy <span className="text-brand-sand italic font-serif">Policy</span>
            </h1>

            <div className="prose prose-lg prose-brand max-w-none text-brand-green/80 space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4 flex items-center">
                  <Eye className="mr-3 w-6 h-6 text-brand-sand" /> 1. Introduction
                </h2>
                <p>
                  SaaSLink Technologies Limited ("we," "us," or "our") is committed to protecting the privacy and security of the data entrusted to us by educational institutions, their staff, students, and parents. This Privacy Policy outlines how we collect, use, disclose, and safeguard information within the SaaSLink Education Management Information System (EMIS).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4 flex items-center">
                  <FileText className="mr-3 w-6 h-6 text-brand-sand" /> 2. Information We Collect
                </h2>
                <p>We process data on behalf of our institutional clients. This information includes, but is not limited to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Institutional Data:</strong> School name, registration details, financial structures, and administrative settings.</li>
                  <li><strong>Student Records:</strong> Names, enrollment history, academic performance, attendance, and disciplinary records.</li>
                  <li><strong>Staff Information:</strong> Employment details, payroll information, and professional credentials.</li>
                  <li><strong>Financial Data:</strong> Fee payment history, M-Pesa/Stripe transaction identifiers, and billing information.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4 flex items-center">
                  <Lock className="mr-3 w-6 h-6 text-brand-sand" /> 3. Data Protection & Security
                </h2>
                <p>
                  We implement enterprise-grade security measures, including end-to-end encryption (AES-256), secure socket layers (SSL), and multi-factor authentication. However, while we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                </p>
              </section>

              <section className="bg-brand-green/5 p-8 rounded-3xl border border-brand-green/10">
                <h2 className="text-2xl font-bold text-brand-green mb-4">4. Limitation of Liability</h2>
                <p className="text-sm italic">
                  To the maximum extent permitted by applicable law, SaaSLink Technologies Limited shall not be liable for any unauthorized access, data breach, or loss of data that occurs despite our implementation of industry-standard security protocols. Users acknowledge that no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4">5. Third-Party Services</h2>
                <p>
                  We utilize trusted third-party processors for specific functions, such as payment processing (Stripe, Safaricom Daraja). These providers have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4">6. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact our Data Protection Officer at <span className="text-brand-green font-bold">legal@saaslink.tech</span>.
                </p>
              </section>
            </div>

            <div className="mt-20 pt-10 border-t border-brand-green/10 text-sm text-brand-green/40">
              Last Updated: March 5, 2026
            </div>
          </motion.div>
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

export default PrivacyPage;
