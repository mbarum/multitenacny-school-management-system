import React, { useState } from 'react';

export const ContactModule: React.FC = () => {
    const [name, setName] = useState('');
    const [school, setSchool] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [curriculum, setCurriculum] = useState('Dual CBC & Traditional');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 700);
    };

    return (
        <section id="contact" className="py-20 bg-white border-t border-slate-200 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Direct Contacts & WhatsApp (5 Cols) */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                                Direct Inquiries & Demos
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                Talk Directly With Our School Systems Team
                            </h2>
                            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                                Whether you're transitioning to Junior Secondary CBC, automating your M-Pesa fee collection, or seeking a complete cloud migration, SaasLink Technologies Ltd is here to guide your school leadership.
                            </p>
                        </div>

                        {/* Contact Cards */}
                        <div className="space-y-4">
                            {/* Phone Hotline */}
                            <a
                                href="tel:0720935895"
                                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-4 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium">Direct Telephone Hotline</div>
                                    <div className="text-lg font-black text-slate-900 group-hover:text-primary-600 transition-colors">
                                        0720935895
                                    </div>
                                    <div className="text-xs text-slate-400">International: +254 720 935 895 &bull; Mon–Sat, 7:30am–6:00pm EAT</div>
                                </div>
                            </a>

                            {/* WhatsApp Button */}
                            <a
                                href="https://wa.me/254720935895?text=Hello%20SaasLink%20Technologies%2C%20I%20would%20like%20to%20inquire%20about%20the%20School%20Management%20System."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-4 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 16 16">
                                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Instant Chat</div>
                                    <div className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                                        Chat on WhatsApp (0720935895)
                                    </div>
                                    <div className="text-xs text-emerald-800/80">Immediate response from our educational software specialists</div>
                                </div>
                            </a>

                            {/* Email & Headquarters */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                    <strong className="text-slate-900">Official Inquiries:</strong>
                                    <a href="mailto:info@saaslink.co.ke" className="text-primary-600 hover:underline">info@saaslink.co.ke</a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong className="text-slate-900">Headquarters:</strong>
                                    <span>SaasLink Technologies Ltd, Westlands, Nairobi, Kenya</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong className="text-slate-900">Company Reg:</strong>
                                    <span>CPR/2023/102941 (Republic of Kenya)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Demo & Consultation Form (7 Cols) */}
                    <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Book an Institutional Demo & Technical Consultation</h3>
                            <p className="text-xs text-slate-600 mt-1">
                                Fill this brief form and our senior systems engineer will contact you within 2 business hours.
                            </p>
                        </div>

                        {isSuccess ? (
                            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-bold text-emerald-900">Inquiry Dispatched Successfully</h4>
                                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                                    Thank you, <strong>{name}</strong>. Our school integration specialist is reviewing your request for <strong>{school}</strong> and will call you on <strong>{phone}</strong> shortly.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setName('');
                                        setSchool('');
                                        setPhone('');
                                        setEmail('');
                                        setMessage('');
                                    }}
                                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Samuel Karanja"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">School Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Hillcrest Junior Academy"
                                            value={school}
                                            onChange={(e) => setSchool(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Direct Phone / WhatsApp *</label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0720935895 or +254..."
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="admin@yourschool.ac.ke"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Active Curriculum Structure</label>
                                    <select
                                        value={curriculum}
                                        onChange={(e) => setCurriculum(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="Dual CBC & Traditional">Dual CBC & Traditional (Primary & Secondary)</option>
                                        <option value="CBC Only">CBC Only (Pre-Primary & Primary)</option>
                                        <option value="Traditional 8-4-4">Traditional 8-4-4 / KCSE</option>
                                        <option value="International IGCSE">International / British IGCSE</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Special Requirements or Questions</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Tell us about your student numbers, M-Pesa paybill setup, or timetable needs..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-[11px] text-slate-500">
                                        Protected by SaasLink Technologies Ltd Privacy Policy.
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/30 transition-all flex items-center gap-2"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Schedule School Demo'}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactModule;
