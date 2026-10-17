import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserPlus,
  X,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Search,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';

export const UsersRolesPage: React.FC = () => {
  const { addToast, user: currentUser, setUser } = useApp();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  // User form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('cashier');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
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

  const resetForm = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('cashier');
    setPhone('');
    setIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setName(u.name || '');
    setEmail(u.email || '');
    setPassword('');
    setShowPassword(false);
    setRole(u.role || 'cashier');
    setPhone(u.phone || '');
    setIsActive(u.isActive !== false);
    setShowAddModal(true);
  };

  const handleToggleStatus = async (u: any) => {
    try {
      const res = await api.updateUserStatus(u.id, !u.isActive);
      if (res.success) {
        addToast(`Operator ${u.name} status updated`, 'success');
        loadUsers();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (u.id === currentUser?.id) {
      addToast('You cannot delete your own active administrator account.', 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete operator "${u.name}" (${u.email})?`)) {
      try {
        const res = await api.deleteUser(u.id);
        if (res.success) {
          addToast(`Operator ${u.name} deleted`, 'info');
          loadUsers();
        }
      } catch (err: any) {
        addToast(err.message || 'Failed to delete operator', 'error');
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = {
          name,
          email,
          role,
          phone,
          isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        const res = await api.updateUser(editingUser.id, payload);
        if (res.success) {
          addToast('Operator account updated successfully', 'success');
          if (currentUser && editingUser.id === currentUser.id) {
            setUser({
              ...currentUser,
              name,
              email,
              role,
              phone,
            });
          }
          setShowAddModal(false);
          resetForm();
          loadUsers();
        }
      } else {
        const res = await api.createUser({ name, email, password, role, phone });
        if (res.success) {
          addToast('Staff operator created successfully', 'success');
          setShowAddModal(false);
          resetForm();
          loadUsers();
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to save operator', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Operators &amp; Role-Based Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Full Administrator CRUD — create, view, edit credentials &amp; roles, activate/deactivate, or delete staff accounts
          </p>
        </div>

        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 self-start cursor-pointer"
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

      {/* Search & Summary Bar */}
      <div className="bg-white dark:bg-[#111915] p-4 rounded-2xl border border-emerald-950/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search operators by name, email, role, phone..."
            className="w-full pl-9 pr-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div>
            Total Staff:{' '}
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {users.length}
            </span>
          </div>
          <div>
            Active:{' '}
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {users.filter((u) => u.isActive).length}
            </span>
          </div>
        </div>
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
                <th className="py-3.5 px-4 text-center">Actions (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading operators...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No operators found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-linear-to-tr from-[#059669] to-[#65a30d] text-white font-extrabold text-[11px] flex items-center justify-center flex-shrink-0">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            (You)
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingUser(u)}
                          title="View Operator Details"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Operator & Reset Password"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.id === currentUser?.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#f1f5f3] dark:bg-white/10 hover:bg-emerald-500/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === currentUser?.id}
                          title="Delete Operator"
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
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
                  {editingUser ? `Edit Operator: ${editingUser.name}` : 'Add New Staff Operator'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="mt-4 space-y-3.5">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUser ? 'Enter new password to reset...' : '••••••••'}
                      className="w-full pl-3 pr-10 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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

                {editingUser && editingUser.id !== currentUser?.id && (
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>Operator Account Active (Can Sign In)</span>
                    </label>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting
                      ? 'Saving...'
                      : editingUser
                      ? 'Save Changes'
                      : 'Create Operator'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW OPERATOR MODAL */}
      <AnimatePresence>
        {viewingUser && (
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
              className="w-full max-w-md bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-500/30 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-[#059669] to-[#65a30d] text-white font-extrabold text-xs flex items-center justify-center">
                    {viewingUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                      {viewingUser.name}
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                      {viewingUser.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                  <span className="text-slate-500">Operator ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {viewingUser.id}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                  <span className="text-slate-500">Email Address</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {viewingUser.email}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                  <span className="text-slate-500">Phone Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {viewingUser.phone || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                  <span className="text-slate-500">Account Status</span>
                  <span
                    className={`font-extrabold ${
                      viewingUser.isActive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {viewingUser.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>
                {viewingUser.createdAt && (
                  <div className="flex justify-between p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                    <span className="text-slate-500">Created Date</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {new Date(viewingUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const target = viewingUser;
                    setViewingUser(null);
                    handleOpenEdit(target);
                  }}
                  className="px-4 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Operator</span>
                </button>
                <button
                  onClick={() => setViewingUser(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
