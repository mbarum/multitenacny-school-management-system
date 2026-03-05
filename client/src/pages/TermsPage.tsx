import React from 'react';
import { motion } from 'framer-motion';
import { Scale, AlertCircle, CheckCircle2, Gavel, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
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
              <Scale className="w-4 h-4" />
              <span>Legal Framework</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-none mb-12 text-brand-green">
              Terms of <span className="text-brand-sand italic font-serif">Service</span>
            </h1>

            <div className="prose prose-lg prose-brand max-w-none text-brand-green/80 space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4 flex items-center">
                  <Gavel className="mr-3 w-6 h-6 text-brand-sand" /> 1. Agreement to Terms
                </h2>
                <p>
                  By accessing or using the SaaSLink EMIS platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. These terms constitute a legally binding agreement between SaaSLink Technologies Limited and the subscribing Institution.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4 flex items-center">
                  <CheckCircle2 className="mr-3 w-6 h-6 text-brand-sand" /> 2. Service Provision
                </h2>
                <p>
                  SaaSLink provides a cloud-based Education Management Information System. We reserve the right to withdraw or amend our service, and any material we provide on the platform, in our sole discretion without notice. We will not be liable if for any reason all or any part of the platform is unavailable at any time or for any period.
                </p>
              </section>

              <section className="bg-brand-green text-brand-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <AlertCircle className="w-32 h-32" />
                </div>
                <h2 className="text-3xl font-bold mb-6 text-brand-sand">3. EXONERATION & LIMITATION OF LIABILITY</h2>
                <div className="space-y-4 text-brand-white/80 font-medium">
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAASLINK TECHNOLOGIES LIMITED, ITS DIRECTORS, EMPLOYEES, OR AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.
                  </p>
                  <p>
                    SAASLINK ASSUMES NO LIABILITY OR RESPONSIBILITY FOR ANY (I) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT; (II) PERSONAL INJURY OR PROPERTY DAMAGE OF ANY NATURE WHATSOEVER RESULTING FROM YOUR ACCESS TO OR USE OF OUR SERVICE; (III) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION STORED THEREIN.
                  </p>
                  <p>
                    IN NO EVENT SHALL SAASLINK'S TOTAL LIABILITY EXCEED THE AMOUNT PAID BY THE INSTITUTION TO SAASLINK IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4">4. User Responsibilities</h2>
                <p>
                  Institutions are responsible for the accuracy of the data entered into the system. You must treat your account credentials as confidential and must not disclose them to any third party. We have the right to disable any user identification code or password at any time if, in our opinion, you have violated any provision of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4">5. Intellectual Property</h2>
                <p>
                  The platform and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by SaaSLink Technologies Limited and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-green mb-4">6. Governing Law</h2>
                <p>
                  These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which SaaSLink Technologies Limited is registered, without regard to its conflict of law provisions.
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

export default TermsPage;
