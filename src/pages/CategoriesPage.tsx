import React, { useState, useEffect } from 'react';
import { Layers, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';

export const CategoriesPage: React.FC = () => {
  const { addToast } = useApp();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([api.getCategories(), api.getProducts()]);
      if (catRes.success) setCategories(catRes.categories);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await api.createCategory({ name, description });
      if (res.success) {
        addToast('Category created successfully', 'success');
        setName('');
        setDescription('');
        setShowAddModal(false);
        loadCategories();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to create category', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Product Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize inventory shelves, filter POS items, and group merchandise
          </p>
        </div>

        <motion.button
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </motion.button>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {categories.map((c) => {
          const itemCount = products.filter((p) => p.category === c.name).length;
          return (
            <motion.div
              key={c.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="p-5 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 hover:border-emerald-500/40 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Layers className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {itemCount} Products
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {c.description || 'General retail category'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="w-full max-w-md bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-950/10 dark:border-white/10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/8 dark:border-white/8">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Create New Category
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Networking & Routers"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Items description..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="px-5 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25"
                  >
                    Save Category
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
