
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { initiateSTKPush } from '../../services/darajaService';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import Spinner from '../common/Spinner';

const SubscriptionLocked: React.FC = () => {
    const { schoolInfo, handleLogout, addNotification, formatCurrency } = useData();
    const [isPaying, setIsPaying] = useState(false);
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SubscriptionPlan.BASIC);

    useEffect(() => {
        api.getPlatformPricing().then(setPricing).catch(console.error);
        if (schoolInfo?.subscription?.plan) {
            setSelectedPlan(schoolInfo.subscription.plan);
        }
    }, [schoolInfo]);

    if (!schoolInfo || !schoolInfo.subscription) return null;

    const sub = schoolInfo.subscription;
    
    const getAmount = () => {
        if (!pricing) return 3000;
        return selectedPlan === SubscriptionPlan.PREMIUM ? pricing.premiumMonthlyPrice : pricing.basicMonthlyPrice;
    };

    const handlePay = async () => {
        setIsPaying(true);
        addNotification("Processing payment request...", "info");
        try {
            const amount = getAmount();
            // Using UPG_ prefix if plan changed, otherwise SUB_
            const prefix = selectedPlan !== sub.plan ? 'UPG' : 'SUB';
            const ref = `${prefix}_${selectedPlan.substring(0,4)}_${schoolInfo.id.substring(0,8)}`;
            
            await initiateSTKPush(amount, schoolInfo.phone || '', ref);
            addNotification("Request sent to your phone. Unlock will be instant after PIN entry.", "success");
        } catch (error: any) {
            addNotification(error.message, "error");
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col md:flex-row">
            {/* Left: Branding & Message */}
            <div className="md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between">
                <div>
                    <div className="bg-red-500/20 p-4 rounded-3xl w-20 h-20 flex items-center justify-center mb-8 border border-red-500/30">
                        <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tight leading-none mb-4">Access<br/>Restricted</h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed">
                        The subscription for <strong>{schoolInfo.name}</strong> expired on {new Date(sub.endDate).toLocaleDateString()}.
                    </p>
                </div>
                
                <div className="pt-10 border-t border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-4">Current Package</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center font-black">{sub.plan[0]}</div>
                        <div>
                            <p className="font-bold text-white">{sub.plan} Plan</p>
                            <p className="text-xs text-slate-500">Standard Administration Tools</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Payment & Upgrade Selection */}
            <div className="md:w-7/12 p-10 md:p-14 bg-white">
                <h3 className="text-2xl font-bold text-slate-800 mb-8">Choose your path to unlock:</h3>
                
                <div className="space-y-4 mb-10">
                    {[
                        { plan: SubscriptionPlan.BASIC, label: 'Standard Access', desc: 'Unlock core admin & accounting', price: pricing?.basicMonthlyPrice || 3000 },
                        { plan: SubscriptionPlan.PREMIUM, label: 'Enterprise Suite', desc: 'Unlock AI, Library & Multi-branch', price: pricing?.premiumMonthlyPrice || 5000, best: true }
                    ].map(p => (
                        <div 
                            key={p.plan}
                            onClick={() => setSelectedPlan(p.plan)}
                            className={`p-6 rounded-3xl border-4 cursor-pointer transition-all relative ${selectedPlan === p.plan ? 'border-primary-500 bg-primary-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            {p.best && <span className="absolute -top-3 right-6 bg-amber-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Recommended</span>}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className={`font-black uppercase text-xs tracking-widest ${selectedPlan === p.plan ? 'text-primary-600' : 'text-slate-400'}`}>{p.label}</p>
                                    <p className="font-bold text-slate-800 text-lg mt-1">{p.desc}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900">{formatCurrency(p.price)}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Per Month</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handlePay}
                        disabled={isPaying}
                        className="w-full flex items-center justify-center py-5 px-8 bg-green-600 text-white rounded-[1.5rem] font-black text-xl hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 active:scale-95 disabled:bg-slate-400"
                    >
                        {isPaying ? <Spinner /> : (
                            <>
                                <img src="https://i.imgur.com/G5YvJ2F.png" className="h-6 mr-3" alt="mpesa" />
                                Pay with M-Pesa STK Push
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest">or pay with card</p>
                    <button className="w-full py-5 px-8 border-2 border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <svg className="w-6 h-6 text-[#635BFF]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                        Secure Card Payment
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 text-xs font-black uppercase tracking-[0.2em] transition-colors">Switch Account</button>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Saaslink Cloud &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionLocked;
