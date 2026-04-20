import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, Shield, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const SuperAdminSettingsPage = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    STRIPE_PUBLISHABLE_KEY: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    MPESA_CONSUMER_KEY: '',
    MPESA_CONSUMER_SECRET: '',
    MPESA_SHORTCODE: '',
    MPESA_PASSKEY: '',
    MPESA_CALLBACK_URL: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/super-admin/config');
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.put('/super-admin/config', settings);
      setSuccessMsg('Configurations saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link to="/super-admin" className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <Shield className="text-blue-500 w-8 h-8" />
            <h1 className="text-3xl font-bold tracking-tighter">System Configurations</h1>
          </div>
          <p className="text-gray-400 mt-2">Manage production API keys for Stripe and M-Pesa natively.</p>
        </header>

        {successMsg && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-xl mb-8">
            {successMsg}
          </div>
        )}

        <div className="space-y-8">
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-indigo-400">Stripe Configurations</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Publishable Key</label>
                <input
                  type="text"
                  name="STRIPE_PUBLISHABLE_KEY"
                  value={settings.STRIPE_PUBLISHABLE_KEY || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="pk_test_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Secret Key</label>
                <input
                  type="password"
                  name="STRIPE_SECRET_KEY"
                  value={settings.STRIPE_SECRET_KEY || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="sk_test_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Webhook Secret</label>
                <input
                  type="password"
                  name="STRIPE_WEBHOOK_SECRET"
                  value={settings.STRIPE_WEBHOOK_SECRET || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="whsec_..."
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-green-400">M-Pesa Configurations</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Consumer Key</label>
                <input
                  type="text"
                  name="MPESA_CONSUMER_KEY"
                  value={settings.MPESA_CONSUMER_KEY || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Daraja Consumer Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Consumer Secret</label>
                <input
                  type="password"
                  name="MPESA_CONSUMER_SECRET"
                  value={settings.MPESA_CONSUMER_SECRET || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Daraja Consumer Secret"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Shortcode (Paybill/Till)</label>
                  <input
                    type="text"
                    name="MPESA_SHORTCODE"
                    value={settings.MPESA_SHORTCODE || ''}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g. 174379"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Passkey</label>
                  <input
                    type="password"
                    name="MPESA_PASSKEY"
                    value={settings.MPESA_PASSKEY || ''}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Lipa Na M-Pesa Online Passkey"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Callback URL (Webhook)</label>
                <input
                  type="text"
                  name="MPESA_CALLBACK_URL"
                  value={settings.MPESA_CALLBACK_URL || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Save size={20} className="mr-2" />
              {saving ? 'Saving...' : 'Save Configurations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPage;
