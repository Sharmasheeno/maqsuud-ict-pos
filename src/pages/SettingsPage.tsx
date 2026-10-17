import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Coins,
  Globe,
  Moon,
  Sun,
  Monitor,
  Lock,
  UserCheck,
  PhoneCall,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';

export const SettingsPage: React.FC = () => {
  const {
    business,
    refreshBusiness,
    currency,
    setCurrency,
    lang,
    setLang,
    theme,
    themeMode,
    setTheme,
    user,
    setUser,
    addToast,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'business' | 'account' | 'currency' | 'language' | 'appearance' | 'security' | 'support'
  >('business');

  // Business Profile Form
  const [bizName, setBizName] = useState(
    business?.name || 'Maqsuud ICT — Smart POS & Enterprise Management'
  );
  const [ownerName, setOwnerName] = useState(business?.ownerName || 'Maqsuud Director');
  const [phone, setPhone] = useState(business?.phone || '0611688269 / 0621688269');
  const [email, setEmail] = useState(business?.email || 'info@maqsuudict.com');
  const [address, setAddress] = useState(
    business?.address || 'KM4 Business Hub, Mogadishu, Somalia'
  );
  const [taxRate, setTaxRate] = useState(String(business?.taxRate || 5));
  const [insuranceRate, setInsuranceRate] = useState(String(business?.insuranceRate || 1));
  const [taxEnabled, setTaxEnabled] = useState(business?.taxEnabled || true);
  const [insuranceEnabled, setInsuranceEnabled] = useState(business?.insuranceEnabled || false);
  const [receiptFooter, setReceiptFooter] = useState(
    business?.receiptFooter || 'Mahadsanid! EVC/Waafi: 0611688269 | Somtel/Waafi: 0621688269 | Salaam Bank AccN: 38524624'
  );
  const [savingBiz, setSavingBiz] = useState(false);

  // Account Profile Form
  const [userName, setUserName] = useState(user?.name || '');
  const [userPhone, setUserPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (business) {
      setBizName(business.name || 'Maqsuud ICT — Smart POS & Enterprise Management');
      setOwnerName(business.ownerName || 'Maqsuud Director');
      setPhone(business.phone || '0611688269 / 0621688269');
      setEmail(business.email || 'info@maqsuudict.com');
      setAddress(business.address || 'KM4 Business Hub, Mogadishu, Somalia');
      setTaxRate(String(business.taxRate || 5));
      setInsuranceRate(String(business.insuranceRate || 1));
      setTaxEnabled(business.taxEnabled !== undefined ? business.taxEnabled : true);
      setInsuranceEnabled(business.insuranceEnabled || false);
      setReceiptFooter(
        business.receiptFooter || 'Mahadsanid! EVC/Waafi: 0611688269 | Somtel/Waafi: 0621688269 | Salaam Bank AccN: 38524624'
      );
    }
  }, [business]);

  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setUserPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBiz(true);
    try {
      const res = await api.updateBusinessSettings({
        name: bizName,
        ownerName,
        phone,
        email,
        address,
        taxRate: parseFloat(taxRate) || 0,
        insuranceRate: parseFloat(insuranceRate) || 0,
        taxEnabled,
        insuranceEnabled,
        receiptFooter,
      });

      if (res.success) {
        addToast('Maqsuud ICT business configuration saved', 'success');
        refreshBusiness();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to save business settings', 'error');
    } finally {
      setSavingBiz(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({ id: user.id, name: userName, phone: userPhone });
      if (res.success) {
        addToast('Operator profile updated', 'success');
        setUser({ ...user, name: userName, phone: userPhone });
      }
    } catch (err: any) {
      addToast(err.message || 'Update failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.changePassword({
        userId: user?.id,
        currentPassword,
        newPassword,
      });
      if (res.success) {
        addToast('Security passkey updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      addToast(err.message || 'Password change failed', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const res = await api.deactivateAccount({ userId: user?.id });
      if (res.success) {
        addToast('Account deactivated. Logging out.', 'info');
        logout();
      }
    } catch (err: any) {
      addToast(err.message || 'Deactivation failed', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', desc: 'United States Dollar (Global standard)' },
    {
      code: 'SOS',
      name: 'Somali Shilling',
      symbol: 'S.Sh',
      desc: 'Official Currency of Federal Republic of Somalia',
    },
    {
      code: 'SLSH',
      name: 'Somaliland Shilling',
      symbol: 'Sl.Sh',
      desc: 'Somaliland Currency denomination',
    },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', desc: 'East African regional commerce' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', desc: 'Ethiopian commercial trading' },
    { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', desc: 'Djibouti port trade' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Enterprise System &amp; Business Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure Maqsuud ICT POS identity, multi-currency formatting, tax rates, language, and security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Sub-nav (4 cols) */}
        <div className="lg:col-span-4 space-y-1.5">
          {[
            { id: 'business', label: 'Business Profile', icon: Building2 },
            { id: 'account', label: 'Account & Plan Access', icon: UserCheck },
            { id: 'currency', label: 'Currency Settings', icon: Coins },
            { id: 'language', label: 'Language & Locale', icon: Globe },
            { id: 'appearance', label: 'Appearance & Theme', icon: Moon },
            { id: 'security', label: 'Password & Security', icon: Lock },
            { id: 'support', label: 'Support & Legal Info', icon: PhoneCall },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                  isActive
                    ? 'bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-md shadow-emerald-600/25'
                    : 'bg-white dark:bg-[#111915] text-slate-700 dark:text-slate-300 border border-emerald-950/10 dark:border-white/10 hover:border-emerald-500/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Settings Body (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111915] rounded-3xl border border-emerald-950/10 dark:border-white/10 p-6 shadow-xs">
          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === 'business' && (
            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Maqsuud ICT Business Identity &amp; Receipt Header
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These details appear on your printed invoices, thermal POS receipts, and official PDF statements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Owner / Director Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enterprise Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Store / Headquarters Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Tax & Insurance Settings */}
              <div className="pt-3 border-t border-emerald-950/8 dark:border-white/8 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Taxes &amp; Product Insurance Rates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3 bg-[#f8faf9] dark:bg-[#141e19] rounded-xl border border-emerald-950/8 dark:border-white/8 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taxEnabled}
                        onChange={(e) => setTaxEnabled(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="font-bold text-xs">Enable Sales Tax Calculation</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-20 px-2 py-1 bg-white dark:bg-[#0b110e] border border-emerald-950/15 dark:border-white/15 rounded-lg text-xs font-mono font-bold"
                      />
                      <span className="text-xs text-slate-500">% Sales Tax rate</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#f8faf9] dark:bg-[#141e19] rounded-xl border border-emerald-950/8 dark:border-white/8 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={insuranceEnabled}
                        onChange={(e) => setInsuranceEnabled(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="font-bold text-xs">Enable Goods Insurance Rate</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={insuranceRate}
                        onChange={(e) => setInsuranceRate(e.target.value)}
                        className="w-20 px-2 py-1 bg-white dark:bg-[#0b110e] border border-emerald-950/15 dark:border-white/15 rounded-lg text-xs font-mono font-bold"
                      />
                      <span className="text-xs text-slate-500">% Goods insurance</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Footer Custom Message
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingBiz}
                  className="px-5 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingBiz ? 'Saving...' : 'Save Business Information'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ACCOUNT & PLAN */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Operator Account &amp; License Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your personal staff profile and view active Maqsuud ICT subscription tier.
                </p>
              </div>

              {/* Current Access Card */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-500/10 to-lime-500/10 border border-emerald-500/25 space-y-2">
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Current Enterprise License
                </div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {business?.subscriptionPlan || 'Professional Plan'} —{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">Active License</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Full POS terminal checkout, optical QR scanner, customer &amp; supplier Deyn/Rasiid ledgers, and perpetual COGS reports are enabled.
                </p>
              </div>

              {/* Personal Edit Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operator Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25"
                  >
                    {savingProfile ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CURRENCY SETTINGS */}
          {activeTab === 'currency' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Multi-Currency Ledger Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the active display currency across dashboard cards, POS carts, receipts, and financial reports.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currencies.map((c) => (
                  <div
                    key={c.code}
                    onClick={() => setCurrency(c.code, c.symbol)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      currency === c.code
                        ? 'border-2 border-emerald-500 bg-emerald-500/8'
                        : 'border-emerald-950/10 dark:border-white/10 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {c.name}
                      </span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {c.code} ({c.symbol})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LANGUAGE SETTINGS */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Language &amp; Regional Settings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose your preferred operator interface language. Changes apply immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setLang('en')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    lang === 'en'
                      ? 'border-2 border-emerald-500 bg-emerald-500/8'
                      : 'border-emerald-950/10 dark:border-white/10'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    English (International)
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard English enterprise labels, POS receipts, and analytics.
                  </p>
                </div>

                <div
                  onClick={() => setLang('so')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    lang === 'so'
                      ? 'border-2 border-emerald-500 bg-emerald-500/8'
                      : 'border-emerald-950/10 dark:border-white/10'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Af-Soomaali
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Luqadda Soomaaliga ee dhammaan qeybaha iibka, deynta, rasiidhada iyo warbixinada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Workspace Surface Theme
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Switch between Frosted Alabaster Light Mode and Deep Carbon Obsidian Dark Mode.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    themeMode === 'light'
                      ? 'border-2 border-emerald-500 bg-emerald-500/8 shadow-sm'
                      : 'border-emerald-950/10 dark:border-white/10 hover:border-emerald-500/40'
                  }`}
                >
                  <Sun className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                    Frosted Light Mode
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">High-contrast daytime clarity</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    themeMode === 'dark'
                      ? 'border-2 border-emerald-500 bg-emerald-500/8 shadow-sm'
                      : 'border-emerald-950/10 dark:border-white/10 hover:border-emerald-500/40'
                  }`}
                >
                  <Moon className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                    Obsidian Dark Mode
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Deep carbon terminal aesthetic
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Change Passkey &amp; Operator Security
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keep your Maqsuud ICT POS terminal login protected with bcrypt-hashed credentials.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-3 pr-10 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-3 pr-10 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25"
                  >
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Account Deactivation Section */}
              <div className="pt-6 border-t border-emerald-950/8 dark:border-white/8">
                <h4 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider">
                  Danger Zone — Account Deactivation
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Deactivating disables your login access while strictly preserving all historical invoices, payments, customer ledgers, and audit logs.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-3 px-4 py-2 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-extrabold hover:bg-rose-500/10"
                  >
                    Deactivate My Account
                  </button>
                ) : (
                  <div className="mt-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      Are you sure you want to deactivate? Only an authorized administrator can restore your access.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeactivate}
                        disabled={deactivating}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold"
                      >
                        {deactivating ? 'Deactivating...' : 'Yes, Deactivate'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT & LEGAL INFO */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Maqsuud ICT Support &amp; Platform Architecture
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct enterprise support channels and system specifications.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="https://wa.me/252611688269"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-extrabold">
                        Official Maqsuud ICT Support &amp; Billing
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                        Hormuud / WaafiPay: 0611688269 • Somtel / WaafiPay: 0621688269 • Salaam Somali Bank AccN: 38524624
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <div className="p-4 rounded-2xl bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    About Maqsuud ICT POS
                  </div>
                  <p>
                    <strong>Maqsuud ICT — Smart POS &amp; Enterprise Management</strong> is a next-generation retail &amp; wholesale intelligence platform engineered for electronics stores, supermarkets, and commercial distributors across East Africa.
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 pt-1">
                    Maqsuud ICT POS v4.2 • Next-Gen ICT &amp; Retail Intelligence
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
