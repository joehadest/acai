// src/components/AdminMenu.tsx

'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaListAlt, FaThList, FaArrowUp, FaArrowDown, FaCopy } from 'react-icons/fa';

// --- COMPONENTE: MODAL DE CÓPIA DE EXTRAS ---
const CopyExtrasModal = ({
  menuItems,
  currentItemId,
  onCopy,
  onClose,
}: {
  menuItems: Partial<MenuItem>[];
  currentItemId?: string;
  onCopy: (extras: { [key: string]: number }) => void;
  onClose: () => void;
}) => {
  const itemsWithExtras = menuItems.filter(
    (item) => item._id !== currentItemId && item.extraOptions && Object.keys(item.extraOptions).length > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[70vh] flex flex-col text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-purple-600">Copiar Extras de Outro Item</h3>
        <div className="overflow-y-auto space-y-2 flex-1">
          {itemsWithExtras.length > 0 ? (
            itemsWithExtras.map((item) => (
              <button
                key={item._id}
                onClick={() => onCopy(item.extraOptions || {})}
                className="w-full text-left p-3 bg-gray-50 hover:bg-purple-100 rounded-md transition-colors border border-gray-200"
              >
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {Object.keys(item.extraOptions || {}).join(', ')}
                </p>
              </button>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Nenhum outro item com extras encontrado.</p>
          )}
        </div>
        <button onClick={onClose} className="form-button-secondary mt-4">
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
};


// --- COMPONENT: ITEM MODAL (COMPLETE) ---
const ItemModal = ({
  item,
  onClose,
  onSave,
  categories,
  menuItems, // Adicionado para a cópia de extras
}: {
  item: Partial<MenuItem>;
  onClose: () => void;
  onSave: (itemData: Partial<MenuItem>) => void;
  categories: { value: string; label: string; allowHalfAndHalf?: boolean }[];
  menuItems: Partial<MenuItem>[]; // Adicionado para a cópia de extras
}) => {
  const [formData, setFormData] = useState<Partial<MenuItem>>(item);
  const [sizesArray, setSizesArray] = useState<{key: string, value: number}[]>([]);
  const [flavorsArray, setFlavorsArray] = useState<{key: string, value: number}[]>([]);
  const [isCopyExtrasModalOpen, setIsCopyExtrasModalOpen] = useState(false);
  const [isCopyFlavorsModalOpen, setIsCopyFlavorsModalOpen] = useState(false);


  useEffect(() => {
    const initialFormData = {
      name: '', description: '', price: 0, category: categories[0]?.value || '',
      image: '', destaque: false, ingredients: [], sizes: {}, flavorOptions: {}, borderOptions: {}, extraOptions: {},
      // Campos de título com valores padrão
      sizesTitle: 'Tamanhos',
      flavorsTitle: 'Sabores',
      extrasTitle: 'Adicionais',
      borderTitle: 'Bordas',
      maxSizes: 1,
      maxFlavors: 1,
      maxExtras: 1,
      ...item,
    };
    setFormData(initialFormData);

    if (initialFormData.sizes) {
      setSizesArray(Object.entries(initialFormData.sizes).map(([key, value]) => ({ key, value })));
    } else {
      setSizesArray([]);
    }

    if (initialFormData.flavorOptions) {
        setFlavorsArray(Object.entries(initialFormData.flavorOptions).map(([key, value]) => ({ key, value })));
    } else {
        setFlavorsArray([]);
    }
  }, [item, categories]);

  // Função para copiar os sabores
  const handleCopyFlavors = (flavorsToCopy: { [key: string]: number }) => {
    setFlavorsArray(Object.entries(flavorsToCopy).map(([key, value]) => ({ key, value })));
    setFormData((prev) => ({
      ...prev,
      flavorOptions: { ...flavorsToCopy },
    }));
    setIsCopyFlavorsModalOpen(false);
  };

  // Modal de copiar sabores
  const CopyFlavorsModal = ({
    menuItems,
    currentItemId,
    onCopy,
    onClose,
  }: {
    menuItems: Partial<MenuItem>[];
    currentItemId?: string;
    onCopy: (flavors: { [key: string]: number }) => void;
    onClose: () => void;
  }) => {
    const itemsWithFlavors = menuItems.filter(
      (item) => item._id !== currentItemId && item.flavorOptions && Object.keys(item.flavorOptions).length > 0
    );
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[70vh] flex flex-col text-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold mb-4 text-purple-600">Copiar Sabores de Outro Item</h3>
          <div className="overflow-y-auto space-y-2 flex-1">
            {itemsWithFlavors.length > 0 ? (
              itemsWithFlavors.map((item) => (
                <button
                  key={item._id}
                  onClick={() => onCopy(item.flavorOptions || {})}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-purple-100 rounded-md transition-colors border border-gray-200"
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {Object.keys(item.flavorOptions || {}).join(', ')}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Nenhum outro item com sabores encontrado.</p>
            )}
          </div>
          <button onClick={onClose} className="form-button-secondary mt-4">
            Fechar
          </button>
        </motion.div>
      </motion.div>
    );
  };
  if (!formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isChecked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? isChecked : value }));
  };
  
  const handleSizeChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSizes = [...sizesArray];
    if (field === 'key') {
      newSizes[index].key = value;
    } else {
      newSizes[index].value = parseFloat(value) || 0;
    }
    setSizesArray(newSizes);
  };
  
  const addSizeField = () => {
    setSizesArray([...sizesArray, { key: `Novo Tamanho ${sizesArray.length + 1}`, value: 0 }]);
  };
  
  const removeSizeField = (index: number) => {
    setSizesArray(sizesArray.filter((_, i) => i !== index));
  };
  
  const moveSize = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sizesArray.length - 1) return;
    
    const newSizes = [...sizesArray];
    const itemToMove = newSizes[index];
    newSizes.splice(index, 1); 
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newSizes.splice(newIndex, 0, itemToMove); 
    setSizesArray(newSizes);
  };

  const handleFlavorChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFlavors = [...flavorsArray];
    if (field === 'key') {
        newFlavors[index].key = value;
    } else {
        newFlavors[index].value = parseFloat(value) || 0;
    }
    setFlavorsArray(newFlavors);
  };

  const addFlavorField = () => {
      setFlavorsArray([...flavorsArray, { key: `Novo Sabor ${flavorsArray.length + 1}`, value: 0 }]);
  };

  const removeFlavorField = (index: number) => {
      setFlavorsArray(flavorsArray.filter((_: any, i: number) => i !== index));
  };

  const moveFlavor = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === flavorsArray.length - 1) return;

      const newFlavors = [...flavorsArray];
      const itemToMove = newFlavors[index];
      newFlavors.splice(index, 1);
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      newFlavors.splice(newIndex, 0, itemToMove);
      setFlavorsArray(newFlavors);
  };


  const handleDynamicChange = (section: 'borderOptions' | 'extraOptions', key: string, field: 'name' | 'price', value: string) => {
    const currentSection = formData[section] || {};
    if (field === 'name') {
      const entries = Object.entries(currentSection);
      const newEntries = entries.map(([k, v]) => (k === key ? [value, v] : [k, v]));
      setFormData(prev => ({ ...prev, [section]: Object.fromEntries(newEntries) }));
    } else {
      setFormData(prev => ({ ...prev, [section]: { ...currentSection, [key]: parseFloat(value) || 0 } }));
    }
  };

  const addDynamicField = (section: 'borderOptions' | 'extraOptions') => {
    const currentSection = formData[section] || {};
    const newKey = `Novo ${Object.keys(currentSection).length + 1}`;
    setFormData(prev => ({ ...prev, [section]: { ...currentSection, [newKey]: 0 } }));
  };

  const removeDynamicField = (section: 'borderOptions' | 'extraOptions', key: string) => {
    const currentSection = { ...(formData[section] || {}) };
    delete (currentSection as any)[key];
    setFormData(prev => ({ ...prev, [section]: currentSection }));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...(formData.ingredients || [])];
    newIngredients[index] = value;
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => setFormData(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), ''] }));
  const removeIngredient = (index: number) => setFormData(prev => ({ ...prev, ingredients: (prev.ingredients || []).filter((_: any, i: number) => i !== index) }));

  // Função para copiar os extras
  const handleCopyExtras = (extrasToCopy: { [key: string]: number }) => {
    setFormData((prev) => ({
      ...prev,
      extraOptions: { ...(prev.extraOptions || {}), ...extrasToCopy },
    }));
    setIsCopyExtrasModalOpen(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sizesAsObject = sizesArray.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as { [key: string]: number });

    const flavorsAsObject = flavorsArray.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as { [key: string]: number });

    onSave({ ...formData, sizes: sizesAsObject, flavorOptions: flavorsAsObject });
  };

  const selectedCategoryObj = categories.find(c => c.value === formData.category);
  const allowHalfAndHalfForCategory = !!selectedCategoryObj?.allowHalfAndHalf; 

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-800 border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-6 text-purple-600">{formData._id ? 'Editar Item' : 'Adicionar Novo Item'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div><label className="form-label">Nome *</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required /></div>
              <div><label className="form-label">Categoria *</label><select name="category" value={formData.category} onChange={handleChange} className="form-input" required>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            </div>
            <div><label className="form-label">Descrição *</label><textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows={3}></textarea></div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div><label className="form-label">Preço Base (R$) *</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="form-input" required step="0.01" /></div>
              <div><label className="form-label">URL da Imagem</label><input type="text" name="image" value={formData.image} onChange={handleChange} className="form-input" /></div>
            </div>
            <div className="flex items-center"><input type="checkbox" id="destaque" name="destaque" checked={formData.destaque} onChange={handleChange} className="form-checkbox" /><label htmlFor="destaque" className="ml-2 block text-sm text-gray-700">Item em destaque</label></div>
            <hr className="border-gray-200" />
            
            <div className="space-y-2">
              <label className="form-label">Ingredientes</label>
              {(formData.ingredients || []).map((ing, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" value={ing} onChange={e => handleIngredientChange(index, e.target.value)} className="form-input flex-grow" />
                  <button type="button" onClick={() => removeIngredient(index)} className="form-button-danger p-2"><FaTrash /></button>
                </div>
              ))}
              <button type="button" onClick={addIngredient} className="form-button-secondary text-sm">+ Adicionar</button>
            </div>
            
            {allowHalfAndHalfForCategory && (
              <div className="space-y-2">
                <label className="form-label font-semibold text-purple-600">Montar Meio a Meio</label>
                <div className="text-sm text-gray-700 mb-2">
                  Permite selecionar dois sabores diferentes para este item.
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="form-label">Tamanhos e Preços</label>
              <div className="mb-2">
                <label className="text-xs text-gray-600">Título do campo de tamanhos:</label>
                <input
                  type="text"
                  value={formData.sizesTitle ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, sizesTitle: e.target.value }))}
                  className="form-input w-1/2 ml-2"
                  placeholder="Ex: Escolha o tamanho"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs text-gray-600">Máximo de escolhas de tamanho:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.maxSizes ?? 1}
                  onChange={e => setFormData(prev => ({ ...prev, maxSizes: parseInt(e.target.value) || 1 }))}
                  className="form-input w-24 ml-2"
                />
              </div>
              {sizesArray.map(({ key, value }, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => moveSize(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"><FaArrowUp/></button>
                    <button type="button" onClick={() => moveSize(index, 'down')} disabled={index === sizesArray.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"><FaArrowDown/></button>
                  </div>
                  <input type="text" value={key} onChange={e => handleSizeChange(index, 'key', e.target.value)} className="form-input w-1/3" placeholder="Ex: Pequena"/>
                  <span className="text-gray-500">R$</span>
                  <input type="number" value={value} onChange={e => handleSizeChange(index, 'value', e.target.value)} className="form-input flex-grow" step="0.01" />
                  <button type="button" onClick={() => removeSizeField(index)} className="form-button-danger p-2"><FaTrash /></button>
                </div>
              ))}
              <button type="button" onClick={addSizeField} className="form-button-secondary text-sm">+ Adicionar Tamanho</button>
            </div>

            <div className="space-y-2">
                <label className="form-label">Sabores e Preços</label>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="text-xs text-gray-600">Título do campo de sabores:</label>
                    <input
                      type="text"
                      value={formData.flavorsTitle ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, flavorsTitle: e.target.value }))}
                      className="form-input w-1/2 ml-2"
                      placeholder="Ex: Escolha o sabor"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCopyFlavorsModalOpen(true)}
                    className="form-button-secondary text-sm flex items-center gap-2"
                  >
                    <FaCopy /> Copiar de outro item
                  </button>
                </div>
                <div className="mb-2">
                  <label className="text-xs text-gray-600">Máximo de escolhas de sabor:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxFlavors ?? 1}
                    onChange={e => setFormData(prev => ({ ...prev, maxFlavors: parseInt(e.target.value) || 1 }))}
                    className="form-input w-24 ml-2"
                  />
                </div>
                {flavorsArray.map(({ key, value }, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button type="button" onClick={() => moveFlavor(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"><FaArrowUp /></button>
                      <button type="button" onClick={() => moveFlavor(index, 'down')} disabled={index === flavorsArray.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"><FaArrowDown /></button>
                    </div>
                    <input type="text" value={key} onChange={e => handleFlavorChange(index, 'key', e.target.value)} className="form-input w-1/3" placeholder="Ex: Chocolate" />
                    <span className="text-gray-500">R$</span>
                    <input type="number" value={value} onChange={e => handleFlavorChange(index, 'value', e.target.value)} className="form-input flex-grow" step="0.01" />
                    <button type="button" onClick={() => removeFlavorField(index)} className="form-button-danger p-2"><FaTrash /></button>
                  </div>
                ))}
                <button type="button" onClick={addFlavorField} className="form-button-secondary text-sm">+ Adicionar Sabor</button>
            </div>
            
            <div className="space-y-2">
              <div className="mb-2">
                <label className="text-xs text-gray-600">Título do campo de borda:</label>
                <input
                  type="text"
                  value={formData.borderTitle ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, borderTitle: e.target.value }))}
                  className="form-input w-1/2 ml-2"
                  placeholder="Ex: Escolha a borda"
                />
              </div>
              <label className="form-label">Opções de Borda</label>
              {Object.entries(formData.borderOptions || {}).map(([key, value], index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" value={key} onChange={e => handleDynamicChange('borderOptions', key, 'name', e.target.value)} className="form-input w-1/3" />
                  <span className="text-gray-500">+ R$</span>
                  <input type="number" value={value as number} onChange={e => handleDynamicChange('borderOptions', key, 'price', e.target.value)} className="form-input flex-grow" step="0.01" />
                  <button type="button" onClick={() => removeDynamicField('borderOptions', key)} className="form-button-danger p-2"><FaTrash /></button>
                </div>
              ))}
              <button type="button" onClick={() => addDynamicField('borderOptions')} className="form-button-secondary text-sm">+ Adicionar</button>
            </div>
            
            <div className="space-y-2">
              <div className="mb-2">
                <label className="text-xs text-gray-600">Título do campo de extras:</label>
                <input
                  type="text"
                  value={formData.extrasTitle ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, extrasTitle: e.target.value }))}
                  className="form-input w-1/2 ml-2"
                  placeholder="Ex: Escolha os extras"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="form-label">Opções de Extras</label>
                <button
                  type="button"
                  onClick={() => setIsCopyExtrasModalOpen(true)}
                  className="form-button-secondary text-sm flex items-center gap-2"
                >
                  <FaCopy /> Copiar de outro item
                </button>
              </div>
              <div className="mb-2">
                <label className="text-xs text-gray-600">Máximo de extras por pedido:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.maxExtras ?? 2}
                  onChange={e => setFormData(prev => ({ ...prev, maxExtras: parseInt(e.target.value) || 1 }))}
                  className="form-input w-24 ml-2"
                />
              </div>
              {Object.entries(formData.extraOptions || {}).map(([key, value], index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" value={key} onChange={e => handleDynamicChange('extraOptions', key, 'name', e.target.value)} className="form-input w-1/3" />
                  <span className="text-gray-500">+ R$</span>
                  <input type="number" value={value as number} onChange={e => handleDynamicChange('extraOptions', key, 'price', e.target.value)} className="form-input flex-grow" step="0.01" />
                  <button type="button" onClick={() => removeDynamicField('extraOptions', key)} className="form-button-danger p-2"><FaTrash /></button>
                </div>
              ))}
              <button type="button" onClick={() => addDynamicField('extraOptions')} className="form-button-secondary text-sm">+ Adicionar</button>
            </div>
            
            <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="form-button-secondary">Cancelar</button><button type="submit" className="form-button-primary"><FaSave className="mr-2" />{formData._id ? 'Atualizar' : 'Salvar'}</button></div>
          </form>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {isCopyExtrasModalOpen && (
          <CopyExtrasModal
            menuItems={menuItems}
            currentItemId={formData._id}
            onCopy={handleCopyExtras}
            onClose={() => setIsCopyExtrasModalOpen(false)}
          />
        )}
        {isCopyFlavorsModalOpen && (
          <CopyFlavorsModal
            menuItems={menuItems}
            currentItemId={formData._id}
            onCopy={handleCopyFlavors}
            onClose={() => setIsCopyFlavorsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};


// --- COMPONENTE DE CATEGORIAS (TEMA CLARO) ---
const CategoriesTab = ({ categories: initialCategories, onUpdate }: { categories: { _id?: string; value: string; label: string; order?: number }[]; onUpdate: () => void }) => {
    const [categories, setCategories] = useState<{ _id?: string; value: string; label: string; order?: number; allowHalfAndHalf?: boolean }[]>(initialCategories);
    const [catForm, setCatForm] = useState({ value: '', label: '', order: 0, allowHalfAndHalf: false });
    const [catEditId, setCatEditId] = useState<string | null>(null);

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
          ? { ...catForm, order: Number(catForm.order), _id: catEditId }
          : { ...catForm, order: Number(catForm.order) };
        const res = await fetch('/api/categories', {
          method: catEditId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setCatForm({ value: '', label: '', order: 0, allowHalfAndHalf: false });
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
      setCatForm({ value: cat.value, label: cat.label, order: cat.order || 0, allowHalfAndHalf: cat.allowHalfAndHalf || false });
      setCatEditId(cat._id || null);
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

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">Gerenciar Categorias</h2>
            <form onSubmit={handleCatSubmit} className="flex flex-col md:flex-row md:items-end gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex flex-col flex-1">
                    <label className="form-label mb-1">Nome da Categoria</label>
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
                <div className="flex flex-col w-24">
                    <label className="form-label mb-1">Ordem</label>
                    <input type="number" name="order" value={catForm.order} onChange={handleCatFormChange} placeholder="Ordem" className="form-input" min={0} required />
                </div>
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
                <table className="w-full text-left text-gray-800 rounded-lg overflow-hidden shadow-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                            <th className="p-3 font-semibold">Ordem</th>
                            <th className="p-3 font-semibold">Nome</th>
                            <th className="p-3 font-semibold">Valor</th>
                            <th className="p-3 font-semibold">Meio a Meio</th>
                            <th className="p-3 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.sort((a, b) => (a.order || 0) - (b.order || 0)).map(cat => (
                            <tr key={cat._id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                                <td className="p-3">{cat.order}</td>
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL (TEMA CLARO) ---
export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [activeTab, setActiveTab] = useState<'menu' | 'categories'>('menu');
  const [categories, setCategories] = useState<{ _id?: string; value: string; label: string; order?: number }[]>([]);
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

  const handleOpenModal = (item: Partial<MenuItem> | null = null) => { setEditingItem(item || {}); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };

  const handleSaveItem = async (itemData: Partial<MenuItem>) => {
    const method = itemData._id ? 'PUT' : 'POST';
    const url = itemData._id ? `/api/menu/${itemData._id}` : '/api/menu';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemData) });
      if (res.ok) { handleCloseModal(); fetchData(); }
      else { alert("Erro ao salvar o item.") }
    } catch (error) { alert("Erro de conexão.") }
  };

  const handleDeleteItem = async (id?: string, name?: string) => {
    if (!id || !name || !confirm(`Excluir "${name}"?`)) return;
    setDeletingItems(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) { setMenuItems(prev => prev.filter(item => item._id !== id)); }
      else { alert('Erro ao excluir.'); }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setDeletingItems(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
    }
  };

  const filteredItems = menuItems.filter((item) => selectedCategory === 'todas' || item.category === selectedCategory);

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 p-4 sm:p-6 lg:p-8">
      <style jsx global>{`
        .form-input { @apply w-full mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-purple-500 focus:border-purple-500 transition-colors; }
        .form-label { @apply block text-sm font-medium text-gray-700; }
        .form-checkbox { @apply h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500; }
        .form-button-primary { @apply px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center font-semibold; }
        .form-button-secondary { @apply px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors; }
        .form-button-danger { @apply p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors; }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div><h1 className="text-3xl font-bold text-gray-800">Admin do Cardápio</h1><p className="text-gray-500 mt-1">Gerencie os itens e categorias.</p></div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${activeTab === 'menu' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`} onClick={() => setActiveTab('menu')}> <FaThList /> Itens</button>
            <button className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${activeTab === 'categories' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`} onClick={() => setActiveTab('categories')}> <FaListAlt /> Categorias</button>
          </div>
        </div>

        {activeTab === 'menu' && (
          <div>
            <div className="bg-white rounded-xl p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-200">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full md:w-auto form-input">
                <option value="todas">Filtrar por Todas as Categorias</option>
                {categories.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
              </select>
              <motion.button onClick={() => handleOpenModal()} whileHover={{ scale: 1.05 }} className="w-full md:w-auto form-button-primary"><FaPlus /> Adicionar Novo Item</motion.button>
            </div>
            {loading ? <p className="text-center py-10">Carregando...</p> : error ? <p className="text-red-500 text-center py-10">{error}</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <motion.div key={item._id} layout className={`bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col justify-between transition-all hover:border-purple-600 ${item.isAvailable === false ? 'opacity-50' : ''}`}>
                    <div>
                      <div className="relative h-40 w-full"><Image src={item.image || '/placeholder.jpg'} alt={item.name} layout="fill" className="object-cover" /></div>
                      <div className="p-4"><h3 className="text-lg font-bold text-gray-900 truncate">{item.name}</h3><p className="text-gray-600 text-sm mt-1">R$ {(Number(item.price) || 0).toFixed(2)}</p></div>
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-2">
                      <div className="flex flex-col items-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={item.isAvailable ?? true} onChange={(e) => handleAvailabilityChange(item, e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div></label><span className={`text-xs mt-1 font-medium ${item.isAvailable ?? true ? 'text-green-600' : 'text-gray-500'}`}>{item.isAvailable ?? true ? 'Disponível' : 'Indisponível'}</span></div>
                      <div className='flex gap-2'>
                        <button className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200" onClick={() => handleOpenModal(item)}><FaEdit /></button>
                        <button className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300 disabled:opacity-50" onClick={() => handleDeleteItem(item._id, item.name)} disabled={deletingItems.has(item._id!)}>{deletingItems.has(item._id!) ? '...' : <FaTrash />}</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && <CategoriesTab categories={categories} onUpdate={fetchData} />}
      </div>

      <AnimatePresence>
        {isModalOpen && <ItemModal item={editingItem!} onClose={handleCloseModal} onSave={handleSaveItem} categories={categories} menuItems={menuItems} />}
      </AnimatePresence>
    </div>
  );
}