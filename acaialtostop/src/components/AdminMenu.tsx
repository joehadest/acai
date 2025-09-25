// src/components/AdminMenu.tsx

'use client';

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Modal antigo removido definitivamente
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaPlus, FaEdit, FaTrash, FaSave, FaListAlt, FaThList } from 'react-icons/fa';

// --- COMPONENTE DE CATEGORIAS (TEMA CLARO) ---
const CategoriesTab = ({ categories: initialCategories, onUpdate }: { categories: { _id?: string; value: string; label: string; order?: number }[]; onUpdate: () => void }) => {
  const [categories, setCategories] = useState<{ _id?: string; value: string; label: string; order?: number; allowHalfAndHalf?: boolean }[]>(initialCategories);
  const [catForm, setCatForm] = useState({ value: '', label: '', allowHalfAndHalf: false });
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const dragItemIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const previousSnapshot = useRef<typeof categories | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<any>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [orderDirty, setOrderDirty] = useState(false); // indica se a ordem foi alterada e não salva

  const scrollFormIntoView = () => {
    if (!formRef.current) return;
    try {
      const rect = formRef.current.getBoundingClientRect();
      const offset = 90; // compensar header fixo
      const target = rect.top + window.scrollY - offset;
      window.scrollTo({ top: target < 0 ? 0 : target, behavior: 'smooth' });
    } catch {}
  };

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    const handleCatFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === 'checkbox';
      const isChecked = (e.target as HTMLInputElement).checked;
      setCatForm(prev => ({ ...prev, [name]: isCheckbox ? isChecked : value }));
    };
  
  const handleCatSubmit = async (e: FormEvent) => {
      e.preventDefault();
      try {
    const body = catEditId
      ? { ...catForm, _id: catEditId }
      : { ...catForm };
        const res = await fetch('/api/categories', {
          method: catEditId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
      setCatForm({ value: '', label: '', allowHalfAndHalf: false });
          setCatEditId(null);
          onUpdate();
        } else {
          alert('Erro ao salvar a categoria.');
        }
      } catch (error) {
        alert('Erro de conexão.');
      }
    };
  
  const handleEditCategory = (cat: any) => {
    setCatForm({ value: cat.value, label: cat.label, allowHalfAndHalf: cat.allowHalfAndHalf || false });
    setCatEditId(cat._id || null);
    // garantir que scroll ocorre após paint das mudanças
    requestAnimationFrame(() => scrollFormIntoView());
  };
  
    const handleDeleteCategory = async (id?: string, name?: string) => {
      if (!id || !name || !confirm(`Excluir a categoria "${name}"?`)) return;
      try {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (res.ok) { onUpdate(); }
        else { alert('Erro ao excluir a categoria.'); }
      } catch (err) {
        alert('Erro de conexão.');
      }
    };

    const beginUndoWindow = () => {
      setShowUndo(true);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setShowUndo(false), 6000);
    };

    const handleUndo = async () => {
      if (previousSnapshot.current) {
        const old = previousSnapshot.current;
        setCategories(old);
        setShowUndo(false);
        setIsSavingOrder(true);
        try {
          await fetch('/api/categories', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ categories: old.map(c=>({_id:c._id})) }) });
          onUpdate();
        } catch { alert('Falha ao reverter'); }
        finally { setIsSavingOrder(false); }
      }
    };

    const handleDragStart = (index: number) => (e: React.DragEvent) => {
      dragItemIndex.current = index;
      setDraggingIndex(index);
      previousSnapshot.current = [...categories];
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragEnterRow = (index: number) => (e: React.DragEvent) => {
      if (dragItemIndex.current === null || dragItemIndex.current === index) return;
      const from = dragItemIndex.current;
      setCategories(prev => {
        const list = [...prev];
        const [moved] = list.splice(from, 1);
        list.splice(index, 0, moved);
        dragItemIndex.current = index;
        return list;
      });
      setOrderDirty(true);
    };

    // Removido: sameOrder/persistIfChanged não são mais usados

    const saveOrder = async () => {
      if (!categories.length) return;
      setIsSavingOrder(true);
      try {
        await fetch('/api/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: categories.map(c => ({ _id: c._id })) }),
        });
        previousSnapshot.current = [...categories];
        setOrderDirty(false);
        onUpdate();
        beginUndoWindow();
      } catch {
        alert('Falha ao salvar nova ordem');
      } finally {
        setIsSavingOrder(false);
      }
    };

    const handleDrop = async () => {
      setDraggingIndex(null);
      dragItemIndex.current = null;
      setOrderDirty(true); // usuário precisa clicar em salvar
    };

    return (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-md">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 sm:mb-6">Gerenciar Categorias</h2>
            <form ref={formRef} onSubmit={handleCatSubmit} className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6 sm:mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex flex-col flex-1">
                    <label className="form-label mb-1 text-sm sm:text-base">Nome da Categoria</label>
                    <input
                        type="text"
                        name="label"
                        value={catForm.label}
                        onChange={handleCatFormChange}
                        placeholder="Ex: Bebidas, Lanches, Doces..."
                        className="form-input"
                        required
                    />
                </div>
                <div className="flex flex-col flex-1">
                    <label className="form-label mb-1">Valor da Categoria</label>
                    <input
                        type="text"
                        name="value"
                        value={catForm.value}
                        onChange={handleCatFormChange}
                        placeholder="Ex: bebidas, lanches, doces..."
                        className="form-input"
                        required
                    />
                </div>
                {/* Ordem removida: agora definida por drag & drop */}
                <div className="flex flex-col justify-center">
                    <label className="form-label mb-1">Meio a Meio</label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="allowHalfAndHalf" checked={catForm.allowHalfAndHalf} onChange={handleCatFormChange} className="form-checkbox" />
                        <span className="text-sm text-gray-700">Permitir</span>
                    </label>
                </div>
                <button type="submit" className="form-button-primary flex-shrink-0 h-10 mt-6 md:mt-0">
                    {catEditId ? 'Atualizar Categoria' : 'Adicionar Categoria'}
                </button>
            </form>
            <div className="overflow-x-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <span className="text-sm text-gray-500">Arraste para reordenar ou use as setas. Clique em "Salvar ordem" para aplicar.</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {orderDirty && !isSavingOrder && (
                      <span className="text-xs font-medium text-amber-600">Alterações não salvas</span>
                    )}
                    {isSavingOrder && <span className="text-xs text-purple-600 animate-pulse">Salvando...</span>}
                    <button
                      type="button"
                      onClick={saveOrder}
                      disabled={!orderDirty || isSavingOrder}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 bg-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 transition"
                    >
                      <FaSave className="w-3 h-3" /> Salvar ordem
                    </button>
                  </div>
                </div>
                {/* Tabela (desktop) */}
                <table className="hidden md:table w-full text-left text-gray-800 rounded-lg overflow-hidden shadow-sm select-none relative">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                      <th className="p-3 font-semibold w-10">#</th>
                      <th className="p-3 font-semibold">Nome</th>
                      <th className="p-3 font-semibold">Valor</th>
                      <th className="p-3 font-semibold">Meio a Meio</th>
                      <th className="p-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {categories.map((cat, index) => (
                        <tr
                          key={cat._id}
                          className={`border-b border-gray-100 cursor-grab active:cursor-grabbing transition-colors ${draggingIndex===index ? 'bg-purple-50 shadow-inner' : 'hover:bg-purple-50'}`}
                          draggable
                          onDragStart={handleDragStart(index)}
                          onDragEnter={handleDragEnterRow(index)}
                          onDragOver={(e)=> e.preventDefault()}
                          onDrop={handleDrop}
                          onDragEnd={handleDrop}
                        >
                          <td className="p-3 text-gray-400 text-xs">
                            <div className="flex flex-col justify-center items-center gap-[2px]">
                              <span className="h-1 w-5 bg-gray-300 rounded" />
                              <span className="h-1 w-5 bg-gray-300 rounded" />
                              <span className="h-1 w-5 bg-gray-300 rounded" />
                            </div>
                          </td>
                          <td className="p-3">{cat.label}</td>
                          <td className="p-3">{cat.value}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cat.allowHalfAndHalf ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                              {cat.allowHalfAndHalf ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td className="p-3 text-right flex gap-2">
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat._id, cat.label)}
                              className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                              title="Excluir"
                            >
                              <FaTrash />
                            </button>
                            <div className="flex flex-col ml-1">
                              <button type="button" aria-label="Mover para cima" className="text-gray-400 hover:text-gray-700 p-0.5 disabled:opacity-30" disabled={index===0}
                                onClick={() => { previousSnapshot.current=[...categories]; setCategories(prev=>{ const list=[...prev]; const [it]=list.splice(index,1); list.splice(index-1,0,it); return list; }); setOrderDirty(true); }}>&uarr;</button>
                              <button type="button" aria-label="Mover para baixo" className="text-gray-400 hover:text-gray-700 p-0.5 disabled:opacity-30" disabled={index===categories.length-1}
                                onClick={() => { previousSnapshot.current=[...categories]; setCategories(prev=>{ const list=[...prev]; const [it]=list.splice(index,1); list.splice(index+1,0,it); return list; }); setOrderDirty(true); }}>&darr;</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {/* Lista Mobile */}
                <ul className="md:hidden space-y-3 select-none">
                  {categories.map((cat, index) => (
                    <li
                      key={cat._id}
                      className={`relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex items-start gap-3 ${draggingIndex===index ? 'ring-2 ring-purple-400/60' : ''}`}
                      draggable
                      onDragStart={handleDragStart(index)}
                      onDragEnter={handleDragEnterRow(index)}
                      onDragOver={(e)=> e.preventDefault()}
                      onDrop={handleDrop}
                      onDragEnd={handleDrop}
                    >
                      <div className="flex flex-col justify-center items-center text-gray-400 pr-1 cursor-grab active:cursor-grabbing">
                        <span className="h-1 w-5 bg-gray-300 rounded mb-0.5" />
                        <span className="h-1 w-5 bg-gray-300 rounded mb-0.5" />
                        <span className="h-1 w-5 bg-gray-300 rounded" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 leading-tight">{cat.label}</p>
                        <p className="text-xs text-gray-500 break-all">{cat.value}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${cat.allowHalfAndHalf ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{cat.allowHalfAndHalf ? 'Meio a Meio' : 'Padrão'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditCategory(cat)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95" aria-label="Editar categoria"><FaEdit className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteCategory(cat._id, cat.label)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:scale-95" aria-label="Excluir categoria"><FaTrash className="w-4 h-4"/></button>
                        </div>
                        <div className="flex gap-1 mt-1 text-gray-400">
                          <button type="button" aria-label="Mover para cima" className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={index===0}
                            onClick={() => { previousSnapshot.current=[...categories]; setCategories(prev=>{ const list=[...prev]; const [it]=list.splice(index,1); list.splice(index-1,0,it); return list; }); setOrderDirty(true); }}>↑</button>
                          <button type="button" aria-label="Mover para baixo" className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={index===categories.length-1}
                            onClick={() => { previousSnapshot.current=[...categories]; setCategories(prev=>{ const list=[...prev]; const [it]=list.splice(index,1); list.splice(index+1,0,it); return list; }); setOrderDirty(true); }}>↓</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <AnimatePresence>
                  {showUndo && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="mt-3 flex items-center justify-between gap-4 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-sm text-purple-700 shadow-sm"
                    >
                      <span>Ordem atualizada.</span>
                      <div className="flex gap-2">
                        <button onClick={handleUndo} className="px-3 py-1 rounded-md bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold">Desfazer</button>
                        <button onClick={()=> setShowUndo(false)} className="px-3 py-1 rounded-md border border-purple-300 text-purple-700 hover:bg-purple-100 text-xs font-medium">Fechar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL (TEMA CLARO) ---
export default function AdminMenu() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Removidos: estados do modal
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'categories'>('menu');
  const [categories, setCategories] = useState<{ _id?: string; value: string; label: string; order?: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Seleciona a primeira categoria ao carregar
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].value);
    }
  }, [categories, selectedCategory]);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([fetch('/api/menu/all'), fetch('/api/categories')]);
      const menuData = await menuRes.json();
      if (menuData.success) {
        const sorted = menuData.data.sort((a: MenuItem, b: MenuItem) => (a.isAvailable === b.isAvailable) ? 0 : a.isAvailable ? -1 : 1);
        setMenuItems(sorted);
      } else { setError('Falha ao carregar o cardápio.'); }
      const catData = await catRes.json();
      if (catData.success) { setCategories(catData.data); }
      else { setError((prev) => prev + ' Falha ao carregar categorias.'); }
    } catch (err) {
      setError('Erro de conexão.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAvailabilityChange = async (item: MenuItem, newStatus: boolean) => {
    setMenuItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, isAvailable: newStatus } : i)));
    try {
      const res = await fetch(`/api/menu/availability/${item._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAvailable: newStatus }) });
      if (!res.ok) throw new Error('Falha na API');
    } catch (error) {
      setMenuItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, isAvailable: !newStatus } : i)));
      alert('Não foi possível atualizar o status.');
    }
  };

  // Removidos: handlers de modal e salvar direto

  const handleDeleteItem = async (id?: string, name?: string) => {
    if (!id || !name || !confirm(`Excluir "${name}"?`)) return;
    setDeletingItems(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setMenuItems(prev => prev.filter(item => item._id !== id)); }
      else { alert('Erro ao excluir.'); }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setDeletingItems(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
    }
  };

  const filteredItems = menuItems.filter((item) => selectedCategory ? item.category === selectedCategory : true);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen text-gray-900 p-4 sm:p-6 lg:p-8">
      <style jsx global>{`
        .form-input { @apply w-full mt-1 p-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm text-base; }
        .form-label { @apply block text-sm font-medium text-gray-700 mb-1; }
        .form-checkbox { @apply h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500; }
        .form-button-primary { @apply px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5; }
        .form-button-secondary { @apply px-4 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 shadow-sm hover:shadow-md; }
        .form-button-danger { @apply p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200; }
        
        /* Melhorias específicas para mobile */
        @media (max-width: 768px) {
          .form-input { 
            @apply text-base; 
            font-size: 16px !important; /* Evita zoom no iOS */
          }
          .form-input:focus { @apply ring-2; } /* Ring mais visível em mobile */
          textarea.form-input { @apply min-h-32; } /* Altura mínima melhor em mobile */
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header aprimorado com gradiente */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <FaThList className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin do Cardápio</h1>
                <p className="text-purple-100 mt-1 text-sm sm:text-base">Gerencie os itens e categorias do seu menu</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button 
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm sm:text-base ${
                  activeTab === 'menu' 
                    ? 'bg-white text-purple-700 shadow-md' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                }`} 
                onClick={() => setActiveTab('menu')}
              >
                <FaThList className="text-sm sm:text-base" /> Itens do Menu
              </button>
              <button 
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm sm:text-base ${
                  activeTab === 'categories' 
                    ? 'bg-white text-purple-700 shadow-md' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                }`} 
                onClick={() => setActiveTab('categories')}
              >
                <FaListAlt className="text-sm sm:text-base" /> Categorias
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'menu' && (
          <div>
            {/* Barra de controles modernizada */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-lg">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar Categoria</label>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)} 
                      className="w-full sm:w-64 form-input appearance-none bg-white"
                    >
                      {/* Removido: opção de todas as categorias */}
                      {categories.map((cat) => (<option key={cat.value} value={cat.value}>🏷️ {cat.label}</option>))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-8">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{filteredItems.length}</div>
                      <div className="text-sm text-blue-700">Itens Total</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{filteredItems.filter(item => item.isAvailable !== false).length}</div>
                      <div className="text-sm text-green-700">Disponíveis</div>
                    </div>
                  </div>
                </div>
                <motion.button 
                  onClick={() => router.push('/admin/menu/new')} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  className="w-full lg:w-auto form-button-primary px-6 py-3 text-base font-bold"
                >
                  <FaPlus className="text-lg mr-2" /> Adicionar Novo Item
                </motion.button>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <span className="ml-4 text-lg text-gray-600">Carregando itens...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div className="text-red-600 text-lg font-semibold">{error}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredItems.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 mb-6">
                      <FaThList className="text-4xl text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum item encontrado</h3>
                    <p className="text-gray-500 text-center mb-6 max-w-md">
                      {`Não há itens na categoria "${categories.find(c => c.value === selectedCategory)?.label || selectedCategory}".`}
                    </p>
                    <motion.button 
                      onClick={() => router.push('/admin/menu/new')} 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className="form-button-primary px-6 py-3"
                    >
                      <FaPlus className="mr-2" /> Adicionar Primeiro Item
                    </motion.button>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                  <motion.div 
                    key={item._id} 
                    layout 
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`group bg-white rounded-2xl overflow-hidden border border-gray-200 flex flex-col justify-between transition-all duration-300 hover:border-purple-300 hover:shadow-xl ${
                      item.isAvailable === false ? 'opacity-60 grayscale' : ''
                    }`}
                  >
                    <div>
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image 
                          src={item.image || '/favicon/favicon-32x32.png'} 
                          alt={item.name} 
                          layout="fill" 
                          className="object-cover transition-transform duration-300 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {item.isAvailable === false && (
                          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                            <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">Indisponível</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">{item.name}</h3>
                        <p className="text-purple-600 text-xl font-bold mt-2">R$ {(Number(item.price) || 0).toFixed(2)}</p>
                        {item.description && (
                          <p className="text-gray-500 text-sm mt-2 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={item.isAvailable ?? true} 
                              onChange={(e) => handleAvailabilityChange(item, e.target.checked)} 
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-green-500 shadow-sm"></div>
                          </label>
                          <span className={`text-xs mt-1 font-medium ${item.isAvailable ?? true ? 'text-green-600' : 'text-gray-500'}`}>
                            {item.isAvailable ?? true ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                        <div className='flex gap-2'>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg" 
                            onClick={() => router.push(`/admin/menu/${item._id}`)}
                            title="Editar item"
                          >
                            <FaEdit className="text-sm" />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg" 
                            onClick={() => handleDeleteItem(item._id, item.name)} 
                            disabled={deletingItems.has(item._id!)}
                            title="Excluir item"
                          >
                            {deletingItems.has(item._id!) ? (
                              <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <FaTrash className="text-sm" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && <CategoriesTab categories={categories} onUpdate={fetchData} />}
      </div>

      {/* Modal removido: navegação para páginas dedicadas de criação/edição */}
    </div>
  );
}