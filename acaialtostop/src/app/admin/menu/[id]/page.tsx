'use client';
// src/app/admin/menu/[id]/page.tsx

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from '@/types/menu';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaSave, FaArrowLeft, FaCopy } from 'react-icons/fa';

// Reutilizando componentes internos que estavam no modal
interface KeyValue { key: string; value: number }

interface SectionWrapperProps { 
  id: string; 
  title: string; 
  description?: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}
const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, title, description, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left group bg-gray-50/70 hover:bg-gray-100 transition-colors"
      >
        <div>
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <span className={`transform transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}>
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div 
            id={`${id}-panel`} 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 text-sm">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const isNewItem = itemId === 'new';

  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  const [categories, setCategories] = useState<{ value: string; label: string; allowHalfAndHalf?: boolean }[]>([]);
  const [sizesArray, setSizesArray] = useState<KeyValue[]>([]);
  const [flavorsArray, setFlavorsArray] = useState<KeyValue[]>([]);
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCopySizesModal, setShowCopySizesModal] = useState(false);
  const [showCopyExtrasModal, setShowCopyExtrasModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(!isNewItem);
  const [isSaving, setIsSaving] = useState(false);
  
  const initialSnapshotRef = useRef<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.data);
        }

        // Carregar todos os itens do menu para seleção
        const menuRes = await fetch('/api/menu/all');
        const menuData = await menuRes.json();
        if (menuData.success) {
          setAvailableItems(menuData.data);
        }

        if (!isNewItem) {
          const itemRes = await fetch(`/api/menu/${itemId}`);
          const itemData = await itemRes.json();
          if (itemData.success) {
            const item = itemData.data;
            setFormData(item);
            setSizesArray(Object.entries(item.sizes || {}).map(([k, v]) => ({ key: k, value: v as number })));
            setFlavorsArray(Object.entries(item.flavorOptions || {}).map(([k, v]) => ({ key: k, value: v as number })));
            initialSnapshotRef.current = JSON.stringify({ f: item, sz: Object.entries(item.sizes || {}), fl: Object.entries(item.flavorOptions || {}) });
          }
        } else {
          // Valores padrão para um novo item
          const defaultCategory = catData.success && catData.data.length > 0 ? catData.data[0].value : '';
          const initialData = {
            name: '', description: '', price: 0, category: defaultCategory, image: '', destaque: false, ingredients: [], 
            sizes: {}, flavorOptions: {}, borderOptions: {}, extraOptions: {},
            sizesTitle: 'Tamanhos', flavorsTitle: 'Sabores', extrasTitle: 'Adicionais', borderTitle: 'Bordas', 
            maxSizes: 1, maxFlavors: 1, maxExtras: 1, isAvailable: true
          };
          setFormData(initialData);
          initialSnapshotRef.current = JSON.stringify({ f: initialData, sz: [], fl: [] });
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [itemId, isNewItem]);

  const isDirty = initialSnapshotRef.current !== JSON.stringify({ f:formData, sz:sizesArray, fl:flavorsArray });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
  };
  
    // Funções auxiliares (handleSizeChange, addSizeField, etc.)
    const updateSizesObject = (arr:KeyValue[])=> arr.reduce((acc,cur)=>{ const k=cur.key.trim(); if(k) acc[k]=cur.value; return acc; },{} as {[k:string]:number});
    const updateFlavorsObject = (arr:KeyValue[])=> arr.reduce((acc,cur)=>{ const k=cur.key.trim(); if(k) acc[k]=cur.value; return acc; },{} as {[k:string]:number});
  
    const handleSizeChange=(i:number,field:'key'|'value',val:string)=>{ setSizesArray(prev=>{ const clone=[...prev]; if(field==='key') clone[i].key=val; else clone[i].value=parseFloat(val)||0; return clone; }); };
    const addSizeField=()=> setSizesArray(prev=>[...prev,{key:`Novo Tamanho ${prev.length+1}`, value:0}]);
    const removeSizeField=(i:number)=> setSizesArray(prev=>prev.filter((_,idx)=>idx!==i));
    const moveSize=(i:number,dir:'up'|'down')=> setSizesArray(prev=>{ if(dir==='up'&&i===0) return prev; if(dir==='down'&&i===prev.length-1) return prev; const clone=[...prev]; const [it]=clone.splice(i,1); clone.splice(dir==='up'? i-1 : i+1,0,it); return clone; });
  
    const handleFlavorChange=(i:number,field:'key'|'value',val:string)=>{ setFlavorsArray(prev=>{ const clone=[...prev]; if(field==='key') clone[i].key=val; else clone[i].value=parseFloat(val)||0; return clone; }); };
    const addFlavorField=()=> setFlavorsArray(prev=>[...prev,{key:`Novo Sabor ${prev.length+1}`, value:0}]);
    const removeFlavorField=(i:number)=> setFlavorsArray(prev=>prev.filter((_,idx)=>idx!==i));
    const moveFlavor=(i:number,dir:'up'|'down')=> setFlavorsArray(prev=>{ if(dir==='up'&&i===0) return prev; if(dir==='down'&&i===prev.length-1) return prev; const clone=[...prev]; const [it]=clone.splice(i,1); clone.splice(dir==='up'? i-1 : i+1,0,it); return clone; });
    
    // Função para copiar sabores de outro item
    const copyFlavorsFromItem = (sourceItem: MenuItem) => {
      if (sourceItem.flavorOptions && Object.keys(sourceItem.flavorOptions).length > 0) {
        const newFlavors = Object.entries(sourceItem.flavorOptions).map(([name, price]) => ({
          key: name,
          value: typeof price === 'number' ? price : 0
        }));
        setFlavorsArray(prev => [...prev, ...newFlavors]);
        setShowCopyModal(false);
      }
    };

    // Função para copiar tamanhos de outro item
    const copySizesFromItem = (sourceItem: MenuItem) => {
      if (sourceItem.sizes && Object.keys(sourceItem.sizes).length > 0) {
        const newSizes = Object.entries(sourceItem.sizes).map(([name, price]) => ({
          key: name,
          value: typeof price === 'number' ? price : 0
        }));
        setSizesArray(prev => [...prev, ...newSizes]);
        setShowCopySizesModal(false);
      }
    };

    // Função para copiar extras de outro item
    const copyExtrasFromItem = (sourceItem: MenuItem) => {
      if (sourceItem.extraOptions && Object.keys(sourceItem.extraOptions).length > 0) {
        const currentExtras = formData.extraOptions || {};
        const newExtras = { ...currentExtras, ...sourceItem.extraOptions };
        setFormData(prev => ({ ...prev, extraOptions: newExtras }));
        setShowCopyExtrasModal(false);
      }
    };
  
    const handleDynamicChange = (section: 'borderOptions' | 'extraOptions', key: string, field: 'name' | 'price', value: string) => {
      setFormData(prev=>{ const current = prev[section] || {}; if(field==='name'){ const entries=Object.entries(current).map(([k,v])=> k===key ? [value,v] : [k,v]); return {...prev,[section]:Object.fromEntries(entries)}; } else { return {...prev,[section]:{...current,[key]: parseFloat(value)||0 }}; } });
    };
    const addDynamicField=(section:'borderOptions'|'extraOptions')=> setFormData(prev=>{ const current=prev[section]||{}; const newKey = `Novo ${Object.keys(current).length+1}`; return {...prev,[section]:{...current,[newKey]:0}}; });
    const removeDynamicField=(section:'borderOptions'|'extraOptions', key:string)=> setFormData(prev=>{ const current={...(prev[section]||{})}; delete (current as any)[key]; return {...prev,[section]:current}; });
  
    const handleIngredientChange=(i:number,val:string)=> setFormData(prev=>{ const ing=[...(prev.ingredients||[])]; ing[i]=val; return {...prev, ingredients: ing}; });
    const addIngredient=()=> setFormData(prev=>({...prev, ingredients:[...(prev.ingredients||[]),'']}));
    const removeIngredient=(i:number)=> setFormData(prev=>({...prev, ingredients:(prev.ingredients||[]).filter((_,idx)=>idx!==i)}));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!formData.description?.trim()) newErrors.description = 'A descrição é obrigatória.';
    if (!formData.category) newErrors.category = 'A categoria é obrigatória.';
    if (isNaN(Number(formData.price)) || Number(formData.price) < 0) newErrors.price = 'O preço é inválido.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSaving(false);
      return;
    }

    const payload = {
      ...formData,
      sizes: updateSizesObject(sizesArray),
      flavorOptions: updateFlavorsObject(flavorsArray),
    };
    
    const url = isNewItem ? '/api/menu' : `/api/menu/${itemId}`;
    const method = isNewItem ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Redireciona de volta para a página principal do admin menu
        router.push('/admin'); 
        // Forçar um refresh para garantir que a tab "menu" seja mostrada com os dados atualizados
        setTimeout(() => router.refresh(), 100); 
      } else {
        const errorData = await res.json();
        setErrors({ form: errorData.error || 'Erro ao salvar o item.' });
      }
    } catch (error) {
      setErrors({ form: 'Erro de conexão.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Carregando item...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Cabeçalho Fixo */}
        <div className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur-sm py-3 px-4 mb-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => router.back()} className="p-2 rounded-md hover:bg-gray-200 transition-colors shrink-0" aria-label="Voltar">
                <FaArrowLeft className="text-gray-600"/>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight truncate max-w-[80vw] sm:max-w-[40vw]">
                  {isNewItem ? 'Adicionar Novo Item' : 'Editar Item'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[80vw] sm:max-w-sm">
                  {!isNewItem ? (formData.name || '') : 'Preencha os dados abaixo'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isDirty && <span className="text-xs text-amber-600 font-semibold hidden md:inline">Alterações não salvas</span>}
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full sm:w-auto justify-center px-5 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 shadow flex items-center gap-2"
              >
                <FaSave />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>

        {errors.form && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{errors.form}</div>}

        <div className="space-y-6 px-4">
            <SectionWrapper id="sec-basic" title="Informações Básicas" description="Nome, categoria, preço e imagem">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Coluna 1 */}
                  <div>
                    <label className="form-label">Nome *</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={`form-input ${errors.name ? 'border-red-500' : ''}`} />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="form-label">Categoria *</label>
                    <select name="category" value={formData.category} onChange={handleChange} className={`form-input ${errors.category ? 'border-red-500' : ''}`}>
                      {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                  </div>
                  <div>
                    <label className="form-label">Preço Base (R$) *</label>
                    <input type="number" name="price" value={formData.price || 0} onChange={handleChange} step="0.01" className={`form-input ${errors.price ? 'border-red-500' : ''}`} />
                    {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
                  </div>
                  <div className="md:col-span-2">
                      <label className="form-label">Descrição *</label>
                      <textarea name="description" value={formData.description || ''} onChange={handleChange} className={`form-input min-h-[100px] ${errors.description ? 'border-red-500' : ''}`} />
                      {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                  </div>
                  <div>
                    <label className="form-label">URL da Imagem</label>
                    <input type="text" name="image" value={formData.image || ''} onChange={handleChange} className="form-input" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="destaque" checked={!!formData.destaque} onChange={handleChange} className="form-checkbox" />
                        <span>Item em destaque</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="isAvailable" checked={formData.isAvailable !== false} onChange={handleChange} className="form-checkbox" />
                        <span>Disponível para venda</span>
                    </label>
                  </div>
                </div>
            </SectionWrapper>
            
            {/* Ingredientes */}
            <SectionWrapper id="sec-ingredients" title="Ingredientes" description="Lista de ingredientes do item">
              <div className="space-y-3">
                {(formData.ingredients || []).map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ing}
                      onChange={(e) => handleIngredientChange(idx, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`Ingrediente ${idx + 1}`}
                    />
                    <button type="button" onClick={() => removeIngredient(idx)} className="form-button-danger" title="Remover ingrediente">
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addIngredient} className="form-button-secondary flex items-center gap-2">
                  <FaPlus /> Adicionar ingrediente
                </button>
              </div>
            </SectionWrapper>

            {/* Tamanhos */}
            <SectionWrapper id="sec-sizes" title="Tamanhos" description="Crie variações de tamanho com preço">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Título da seção</label>
                  <input type="text" name="sizesTitle" value={formData.sizesTitle || ''} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Máx. tamanhos selecionáveis</label>
                  <input type="number" name="maxSizes" value={formData.maxSizes || 1} onChange={handleChange} className="form-input" min={1} />
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {sizesArray.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_110px_auto_auto] items-center gap-2">
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) => handleSizeChange(i, 'key', e.target.value)}
                      className="form-input"
                      placeholder={`Nome do tamanho ${i + 1}`}
                    />
                    <span className="text-gray-400 text-sm text-center">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={row.value}
                      onChange={(e) => handleSizeChange(i, 'value', e.target.value)}
                      className="form-input"
                      placeholder="0,00"
                    />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveSize(i, 'up')} disabled={i === 0} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40" title="Mover para cima"><FaArrowUp /></button>
                      <button type="button" onClick={() => moveSize(i, 'down')} disabled={i === sizesArray.length - 1} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40" title="Mover para baixo"><FaArrowDown /></button>
                    </div>
                    <button type="button" onClick={() => removeSizeField(i)} className="form-button-danger" title="Remover tamanho"><FaTrash /></button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={addSizeField} className="form-button-secondary flex items-center gap-2">
                    <FaPlus /> Adicionar tamanho
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCopySizesModal(true)} 
                    className="form-button-secondary flex items-center gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    <FaCopy /> Copiar tamanhos
                  </button>
                </div>
              </div>
            </SectionWrapper>

            {/* Sabores */}
            <SectionWrapper id="sec-flavors" title="Sabores" description="Sabores e possíveis diferenças de preço">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Título da seção</label>
                  <input type="text" name="flavorsTitle" value={formData.flavorsTitle || ''} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Máx. sabores selecionáveis</label>
                  <input type="number" name="maxFlavors" value={formData.maxFlavors || 1} onChange={handleChange} className="form-input" min={1} />
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {flavorsArray.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_110px_auto_auto] items-center gap-2">
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) => handleFlavorChange(i, 'key', e.target.value)}
                      className="form-input"
                      placeholder={`Nome do sabor ${i + 1}`}
                    />
                    <span className="text-gray-400 text-sm text-center">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={row.value}
                      onChange={(e) => handleFlavorChange(i, 'value', e.target.value)}
                      className="form-input"
                      placeholder="0,00"
                    />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveFlavor(i, 'up')} disabled={i === 0} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40" title="Mover para cima"><FaArrowUp /></button>
                      <button type="button" onClick={() => moveFlavor(i, 'down')} disabled={i === flavorsArray.length - 1} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40" title="Mover para baixo"><FaArrowDown /></button>
                    </div>
                    <button type="button" onClick={() => removeFlavorField(i)} className="form-button-danger" title="Remover sabor"><FaTrash /></button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={addFlavorField} className="form-button-secondary flex items-center gap-2">
                    <FaPlus /> Adicionar sabor
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCopyModal(true)} 
                    className="form-button-secondary flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <FaCopy /> Copiar sabores
                  </button>
                </div>
              </div>
            </SectionWrapper>

            {/* Bordas */}
            <SectionWrapper id="sec-borders" title="Bordas" description="Opções de bordas com preço">
              <div className="space-y-3">
                {Object.entries(formData.borderOptions || {}).map(([key, price], idx) => (
                  <div key={key + idx} className="grid grid-cols-[1fr_auto_110px_auto] items-center gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => handleDynamicChange('borderOptions', key, 'name', e.target.value)}
                      className="form-input"
                      placeholder="Nome da borda"
                    />
                    <span className="text-gray-400 text-sm text-center">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={Number(price) || 0}
                      onChange={(e) => handleDynamicChange('borderOptions', key, 'price', e.target.value)}
                      className="form-input"
                      placeholder="0,00"
                    />
                    <button type="button" onClick={() => removeDynamicField('borderOptions', key)} className="form-button-danger" title="Remover borda"><FaTrash /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addDynamicField('borderOptions')} className="form-button-secondary flex items-center gap-2">
                  <FaPlus /> Adicionar borda
                </button>
              </div>
            </SectionWrapper>

            {/* Adicionais */}
            <SectionWrapper id="sec-extras" title="Adicionais" description="Opções extras com preço">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Título da seção</label>
                  <input type="text" name="extrasTitle" value={formData.extrasTitle || ''} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Máx. adicionais selecionáveis</label>
                  <input type="number" name="maxExtras" value={formData.maxExtras || 1} onChange={handleChange} className="form-input" min={0} />
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {Object.entries(formData.extraOptions || {}).map(([key, price], idx) => (
                  <div key={key + idx} className="grid grid-cols-[1fr_auto_110px_auto] items-center gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => handleDynamicChange('extraOptions', key, 'name', e.target.value)}
                      className="form-input"
                      placeholder="Nome do adicional"
                    />
                    <span className="text-gray-400 text-sm text-center">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={Number(price) || 0}
                      onChange={(e) => handleDynamicChange('extraOptions', key, 'price', e.target.value)}
                      className="form-input"
                      placeholder="0,00"
                    />
                    <button type="button" onClick={() => removeDynamicField('extraOptions', key)} className="form-button-danger" title="Remover adicional"><FaTrash /></button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => addDynamicField('extraOptions')} className="form-button-secondary flex items-center gap-2">
                    <FaPlus /> Adicionar adicional
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCopyExtrasModal(true)} 
                    className="form-button-secondary flex items-center gap-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                  >
                    <FaCopy /> Copiar extras
                  </button>
                </div>
              </div>
            </SectionWrapper>

            {/* Configurações */}
            <SectionWrapper id="sec-availability" title="Configurações" description="Disponibilidade e destaques">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isAvailable" checked={formData.isAvailable !== false} onChange={handleChange} className="form-checkbox" />
                    <span>Disponível para venda</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="destaque" checked={!!formData.destaque} onChange={handleChange} className="form-checkbox" />
                    <span>Item em destaque</span>
                  </label>
                </div>
              </div>
            </SectionWrapper>

        </div>
      </form>

      {/* Modal para copiar sabores */}
      <AnimatePresence>
        {showCopyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowCopyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Copiar sabores de outro item</h3>
              
              <div className="space-y-2 mb-4">
                {availableItems
                  .filter(item => 
                    item._id !== itemId && 
                    item.flavorOptions && 
                    Object.keys(item.flavorOptions).length > 0
                  )
                  .map((item) => (
                    <div
                      key={item._id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => copyFlavorsFromItem(item)}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Categoria: {item.category}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {Object.keys(item.flavorOptions || {}).length} sabores: {' '}
                        {Object.keys(item.flavorOptions || {}).slice(0, 3).join(', ')}
                        {Object.keys(item.flavorOptions || {}).length > 3 && '...'}
                      </div>
                    </div>
                  ))}
              </div>

              {availableItems.filter(item => 
                item._id !== itemId && 
                item.flavorOptions && 
                Object.keys(item.flavorOptions).length > 0
              ).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Nenhum item com sabores encontrado
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para copiar tamanhos */}
      <AnimatePresence>
        {showCopySizesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowCopySizesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Copiar tamanhos de outro item</h3>
              
              <div className="space-y-2 mb-4">
                {availableItems
                  .filter(item => 
                    item._id !== itemId && 
                    item.sizes && 
                    Object.keys(item.sizes).length > 0
                  )
                  .map((item) => (
                    <div
                      key={item._id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => copySizesFromItem(item)}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Categoria: {item.category}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {Object.keys(item.sizes || {}).length} tamanhos: {' '}
                        {Object.keys(item.sizes || {}).slice(0, 3).join(', ')}
                        {Object.keys(item.sizes || {}).length > 3 && '...'}
                      </div>
                    </div>
                  ))}
              </div>

              {availableItems.filter(item => 
                item._id !== itemId && 
                item.sizes && 
                Object.keys(item.sizes).length > 0
              ).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Nenhum item com tamanhos encontrado
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCopySizesModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para copiar extras */}
      <AnimatePresence>
        {showCopyExtrasModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowCopyExtrasModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Copiar extras de outro item</h3>
              
              <div className="space-y-2 mb-4">
                {availableItems
                  .filter(item => 
                    item._id !== itemId && 
                    item.extraOptions && 
                    Object.keys(item.extraOptions).length > 0
                  )
                  .map((item) => (
                    <div
                      key={item._id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => copyExtrasFromItem(item)}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Categoria: {item.category}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {Object.keys(item.extraOptions || {}).length} extras: {' '}
                        {Object.keys(item.extraOptions || {}).slice(0, 3).join(', ')}
                        {Object.keys(item.extraOptions || {}).length > 3 && '...'}
                      </div>
                    </div>
                  ))}
              </div>

              {availableItems.filter(item => 
                item._id !== itemId && 
                item.extraOptions && 
                Object.keys(item.extraOptions).length > 0
              ).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Nenhum item com extras encontrado
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCopyExtrasModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
