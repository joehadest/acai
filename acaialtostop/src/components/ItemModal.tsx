// src/components/ItemModal.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from '../types/menu';

interface ItemModalProps {
    item: MenuItem;
    onClose: () => void;
    onAddToCart: (item: MenuItem, quantity: number, unitPrice: number, observation: string, size?: string, border?: string, extras?: string[], flavors?: string[]) => void;
    allPizzas?: MenuItem[];
    categories?: any[];
    allowHalfAndHalf?: boolean;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2 }
    }
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

export default function ItemModal({ item, onClose, onAddToCart, allPizzas, categories = [], allowHalfAndHalf = false }: ItemModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [observation, setObservation] = useState('');
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
    const [selectedBorder, setSelectedBorder] = useState<string>('');
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [isHalf, setIsHalf] = useState(false);
    const [half1, setHalf1] = useState<MenuItem | null>(item);
    const [half2, setHalf2] = useState<MenuItem | null>(null);
    const [showScrollHint, setShowScrollHint] = useState(false);
    
    const maxExtras = item.maxExtras ?? 2;
    const maxSizes = item.maxSizes ?? 1;
    const maxFlavors = item.maxFlavors ?? 1;

    useEffect(() => {
        setHalf1(item);
        setHalf2(null);
        setIsHalf(false);
        setSelectedSizes([]);
        setSelectedFlavors([]);
        setSelectedBorder('');
        setSelectedExtras([]);
        setObservation('');
        setQuantity(1);
    }, [item]);

    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        if (isMobile) {
            setShowScrollHint(true);
            const timer = setTimeout(() => setShowScrollHint(false), 3500);
            return () => clearTimeout(timer);
        }
    }, [item]);

    const itemCategory = categories.find(c => c.value === item.category);

    const calculateUnitPrice = () => {
        let price = 0;

        if (item.sizes && selectedSizes.length > 0) {
            selectedSizes.forEach(size => {
                price += item.sizes![size as keyof typeof item.sizes] || 0;
            });
        }

        if (!item.sizes || selectedSizes.length === 0) {
            price += item.price;
        }

        if (item.flavorOptions && selectedFlavors.length > 0) {
            selectedFlavors.forEach(flavor => {
                price += item.flavorOptions![flavor as keyof typeof item.flavorOptions] || 0;
            });
        }

        if (item.category === 'pizzas' && isHalf && half1 && half2 && allPizzas && selectedSizes.length > 0) {
            const sizeKey = selectedSizes[0] as keyof typeof item.sizes;
            const pizza1 = allPizzas.find(p => p.name === half1.name);
            const pizza2 = allPizzas.find(p => p.name === half2.name);

            if (pizza1 && pizza2) {
                const price1 = pizza1.sizes?.[sizeKey] || pizza1.price;
                const price2 = pizza2.sizes?.[sizeKey] || pizza2.price;
                price = Math.max(price1, price2);
            }
        }

        if (selectedBorder && item.borderOptions) {
            price += item.borderOptions[selectedBorder] || 0;
        }

        if (item.extraOptions) {
            selectedExtras.forEach(extra => {
                price += item.extraOptions![extra] || 0;
            });
        }

        return price;
    };

    const calculateTotal = () => {
        const unitPrice = calculateUnitPrice();
        return unitPrice * quantity;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isHalf && (!half1 || !half2)) {
            alert('Por favor, selecione ambos os sabores para a pizza meio a meio.');
            return;
        }
        if (item.sizes && Object.keys(item.sizes).length > 0 && selectedSizes.length === 0) {
            alert('Por favor, selecione ao menos um tamanho.');
            return;
        }
        if (item.flavorOptions && Object.keys(item.flavorOptions).length > 0 && selectedFlavors.length === 0) {
            alert('Por favor, selecione ao menos um sabor.');
            return;
        }

        const finalObservation = isHalf && half1 && half2
            ? `Meio a meio: ${half1.name} / ${half2.name}${observation ? ` - ${observation}` : ''}`
            : observation;

        const sizeString = selectedSizes.join(', ');
        const unitPrice = calculateUnitPrice();

        onAddToCart(item, quantity, unitPrice, finalObservation, sizeString, selectedBorder, selectedExtras, selectedFlavors);
        onClose();
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev => {
            if (prev.includes(size)) {
                return prev.filter(s => s !== size);
            } else {
                if (prev.length < maxSizes) {
                    return [...prev, size];
                } else {
                    alert(`Você pode selecionar no máximo ${maxSizes} opções.`);
                    return prev;
                }
            }
        });
    };

    const toggleFlavor = (flavor: string) => {
        setSelectedFlavors(prev => {
            if (prev.includes(flavor)) {
                return prev.filter(f => f !== flavor);
            } else {
                if (prev.length < maxFlavors) {
                    return [...prev, flavor];
                } else {
                    alert(`Você pode selecionar no máximo ${maxFlavors} sabores.`);
                    return prev;
                }
            }
        });
    };

    const toggleExtra = (extra: string) => {
        setSelectedExtras(prev => {
            if (prev.includes(extra)) {
                return prev.filter(e => e !== extra);
            } else {
                if (prev.length < maxExtras) {
                    return [...prev, extra];
                }
                return prev;
            }
        });
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-6 bg-gradient-to-b from-black/30 via-black/20 to-black/30 backdrop-blur-sm overflow-y-auto"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose}
            >
                <motion.div
                    className="relative w-full max-w-5xl bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-purple-200 flex flex-col max-h-[95vh]"
                    variants={modalVariants}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Hint flutuante mobile (dentro do modal agora) */}
                    <AnimatePresence>
                      {showScrollHint && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                          style={{ paddingTop: 'env(safe-area-inset-top)' }}
                        >
                          <div className="bg-purple-600/95 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                            <span>Role para baixo para ver as opções</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Cabeçalho Sticky */}
                    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-4 border-b bg-white/90 backdrop-blur rounded-t-2xl">
                        <div>
                            <h3 className="text-2xl font-bold text-purple-700 leading-tight">{item.name}</h3>
                            {itemCategory && <p className="text-xs mt-1 font-medium uppercase tracking-wide text-purple-500">{itemCategory.label}</p>}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                            aria-label="Fechar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </motion.button>
                    </div>

                    {/* Conteúdo Scrollável */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
                        {/* Hero / Imagem e descrição */}
                        <div className="grid md:grid-cols-5 gap-6">
                          {item.image && (
                            <div className="md:col-span-2">
                              <div className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-purple-200/70 shadow-sm">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                          <div className={item.image ? 'md:col-span-3 flex flex-col' : 'md:col-span-5 flex flex-col'}>
                            <p className="text-gray-600 leading-relaxed">
                              {item.description}
                            </p>
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="mt-4 bg-purple-50/60 border border-purple-200 rounded-lg p-4 text-sm">
                                <span className="font-semibold text-purple-700 block mb-1">Ingredientes</span>
                                <p className="text-purple-700/80">{item.ingredients.join(', ')}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Coluna 1 */}
                            <div className="space-y-6">
                              {item.sizes && Object.keys(item.sizes).length > 0 && (
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">{item.sizesTitle || 'Tamanhos'}</label>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(item.sizes).map(([sizeKey, price]) => {
                                      const isSelected = selectedSizes.includes(sizeKey);
                                      const isDisabled = !isSelected && selectedSizes.length >= maxSizes;
                                      return (
                                        <button
                                          key={sizeKey}
                                          type="button"
                                          onClick={() => toggleSize(sizeKey)}
                                          disabled={isDisabled}
                                          className={`group relative p-3 rounded-lg border-2 text-left transition-all flex flex-col gap-1 ${isSelected ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-200 hover:border-purple-400 bg-white'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          <span className="font-semibold text-sm text-gray-800 group-hover:text-purple-700">{sizeKey}</span>
                                          <span className="text-xs text-gray-500">{price > 0 ? `+ R$ ${price.toFixed(2)}` : 'Incluído'}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-3">Máximo de {maxSizes} tamanho(s).</div>
                                </div>
                              )}

                              {item.flavorOptions && Object.keys(item.flavorOptions).length > 0 && (
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">{item.flavorsTitle || 'Sabores'}</label>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(item.flavorOptions).map(([flavorKey, price]) => {
                                      const isSelected = selectedFlavors.includes(flavorKey);
                                      const isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;
                                      return (
                                        <button
                                          key={flavorKey}
                                          type="button"
                                          onClick={() => toggleFlavor(flavorKey)}
                                          disabled={isDisabled}
                                          className={`group relative p-3 rounded-lg border-2 text-left transition-all flex flex-col gap-1 ${isSelected ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-200 hover:border-purple-400 bg-white'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          <span className="font-semibold text-sm text-gray-800 group-hover:text-purple-700">{flavorKey}</span>
                                          <span className="text-xs text-gray-500">{price > 0 ? `+ R$ ${price.toFixed(2)}` : 'Incluído'}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-3">Máximo de {maxFlavors} sabor(es).</div>
                                </div>
                              )}

                              {item.borderOptions && Object.keys(item.borderOptions).length > 0 && (
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">{item.borderTitle || 'Borda'}</label>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBorder('')}
                                      className={`p-3 rounded-lg border-2 transition-all flex flex-col gap-1 ${!selectedBorder ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-200 hover:border-purple-400 bg-white'}`}
                                    >
                                      <span className="font-semibold text-sm text-gray-800">Sem Borda</span>
                                    </button>
                                    {Object.entries(item.borderOptions).map(([key, value]) => (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedBorder(key)}
                                        className={`p-3 rounded-lg border-2 transition-all flex flex-col gap-1 ${selectedBorder === key ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-200 hover:border-purple-400 bg-white'}`}
                                      >
                                        <span className="font-semibold text-sm text-gray-800">{key}</span>
                                        <span className="text-xs text-gray-500">+ R$ {value.toFixed(2)}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Coluna 2 */}
                            <div className="space-y-6">
                              {item.extraOptions && Object.keys(item.extraOptions).length > 0 && (
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">{item.extrasTitle || 'Extras'}</label>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(item.extraOptions).map(([key, value]) => {
                                      const isSelected = selectedExtras.includes(key);
                                      const isDisabled = !isSelected && selectedExtras.length >= maxExtras;
                                      return (
                                        <button
                                          key={key}
                                          type="button"
                                          onClick={() => toggleExtra(key)}
                                          disabled={isDisabled}
                                          className={`group relative p-3 rounded-lg border-2 text-left transition-all flex flex-col gap-1 ${isSelected ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-200 hover:border-purple-400 bg-white'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          <span className="font-semibold text-sm text-gray-800 group-hover:text-purple-700">{key}</span>
                                          <span className="text-xs text-gray-500">+ R$ {value.toFixed(2)}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-3">Máximo de {maxExtras} extra(s).</div>
                                </div>
                              )}

                              {itemCategory?.allowHalfAndHalf && allPizzas && (
                                <div className={`p-5 rounded-xl border transition-all shadow-sm ${isHalf ? 'bg-purple-50 border-purple-400' : 'bg-gray-50 border-gray-200/80'}`}
                                >
                                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isHalf}
                                      onChange={e => setIsHalf(e.target.checked)}
                                      className="form-checkbox h-5 w-5 text-purple-600"
                                    />
                                    <span className="text-sm font-semibold text-gray-800">Montar Meio a Meio</span>
                                  </label>
                                  {isHalf && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                      <select
                                        className="form-input"
                                        value={half1?.name || ''}
                                        onChange={e => setHalf1(allPizzas.find(p => p.name === e.target.value) || null)}
                                      >
                                        {allPizzas.map(p => (
                                          <option key={p._id} value={p.name}>{p.name}</option>
                                        ))}
                                      </select>
                                      <select
                                        className="form-input"
                                        value={half2?.name || ''}
                                        onChange={e => setHalf2(allPizzas.find(p => p.name === e.target.value) || null)}
                                      >
                                        <option value="">Selecione o 2º sabor</option>
                                        {allPizzas.filter(p => p.name !== half1?.name).map(p => (
                                          <option key={p._id} value={p.name}>{p.name}</option>
                                        ))}
                                      </select>
                                    </motion.div>
                                  )}
                                </div>
                              )}

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">Quantidade</label>
                                  <div className="flex items-center justify-center gap-6">
                                    <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-11 h-11 rounded-full bg-white border border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600 transition">-</button>
                                    <span className="text-3xl font-bold tabular-nums text-purple-700">{quantity}</span>
                                    <button type="button" onClick={() => setQuantity(q => q + 1)} className="w-11 h-11 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-sm transition">+</button>
                                  </div>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">Observação</label>
                                  <textarea
                                    value={observation}
                                    onChange={(e) => setObservation(e.target.value)}
                                    placeholder="Ex: Sem cebola, bem passada..."
                                    className="form-input min-h-[120px] resize-y"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* Footer Sticky */}
                      <div className="sticky bottom-0 z-10 px-6 py-4 border-t bg-white/95 backdrop-blur rounded-b-2xl">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => { e.preventDefault(); const fake = { preventDefault: () => {} } as any; handleSubmit(fake); }}
                            disabled={isHalf && (!half1 || !half2)}
                            className="w-full px-8 py-4 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg flex justify-between items-center"
                          >
                            <span>Adicionar</span>
                            <span>R$ {calculateTotal().toFixed(2)}</span>
                          </motion.button>
                      </div>
                    </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}