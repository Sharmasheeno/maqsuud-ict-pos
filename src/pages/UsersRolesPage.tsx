import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';

export const UsersRolesPage: React.FC = () => {
  const { addToast, user: currentUser } = useApp();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New user form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.users);
        setRoles(res.roles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const res = await api.updateUserStatus(user.id, !user.isActive);
      if (res.success) {
        addToast(`Operator ${user.name} status updated`, 'success');
        loadUsers();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createUser({ name, email, password, role, phone });
      if (res.success) {
        addToast('Staff operator created successfully', 'success');
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        loadUsers();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Operators &amp; Role-Based Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure Maqsuud ICT terminal permissions for Cashiers, Store Managers, Accountants, and Administrators
          </p>
        </div>

        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Operator</span>
        </motion.button>
      </div>

      {/* Role Breakdown Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => (
          <div
            key={r.id}
            className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-extrabold text-slate-900 dark:text-white text-sm">
                {r.name}
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>
            <div className="mt-3 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {users.filter((u) => u.role.toLowerCase() === r.name.toLowerCase()).length} assigned staff
            </div>
          </div>
        ))}
      </div>

      {/* Users List Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8faf9] dark:bg-[#0b110e] border-b border-emerald-950/10 dark:border-white/10 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Staff Operator</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-center">Assigned Role</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading operators...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-linear-to-tr from-[#059669] to-[#65a30d] text-white font-extrabold text-[11px] flex items-center justify-center">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{u.phone || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          u.isActive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.id === currentUser?.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1f5f3] dark:bg-white/10 hover:bg-emerald-500/15 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="w-full max-w-md bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-500/30"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Add New Staff Operator
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sahra Warsame"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@maqsuudict.com"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Role Permission
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold capitalize"
                    >
                      <option value="cashier">Cashier</option>
                      <option value="manager">Store Manager</option>
                      <option value="accountant">Accountant</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+252 61..."
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Operator'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
