// src/components/ItemModal.tsx

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
    
    const maxExtras = item.maxExtras ?? 2;
    const maxSizes = item.maxSizes ?? 1;
    const maxFlavors = item.maxFlavors ?? 1;

    // Reset sempre que item mudar
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

    // Montagem para portal / lock scroll
    useEffect(() => {
      setMounted(true);
      // salvar foco anterior
      lastFocusedElementRef.current = document.activeElement as HTMLElement;
      // bloquear scroll body
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
        // restaurar foco
        if (lastFocusedElementRef.current) {
          lastFocusedElementRef.current.focus({ preventScroll: true });
        }
      };
    }, []);

    // Foco inicial e ESC
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
        if (e.key === 'Tab') {
          // focus trap simples
          if (!contentRef.current) return;
          const focusables = contentRef.current.querySelectorAll<HTMLElement>(
            'button, select, textarea, input, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
            const last = focusables[focusables.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      window.addEventListener('keydown', handler);
      // delay focus para garantir render
      const to = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 30);
      return () => { window.removeEventListener('keydown', handler); clearTimeout(to); };
    }, [onClose]);

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
    
    const scrollToSection = (key: string) => {
      const target = contentRef.current?.querySelector(`[data-section="${key}"]`) as HTMLElement | null;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.classList.add('ring-2','ring-amber-400','ring-offset-2','ring-offset-white');
        setTimeout(() => {
          target.classList.remove('ring-2','ring-amber-400','ring-offset-2','ring-offset-white');
        }, 2600);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);
      if (isHalf && (!half1 || !half2)) {
        setValidationError('Selecione os dois sabores para montar a pizza meio a meio.');
        scrollToSection('meio');
        return;
      }
      if (item.sizes && Object.keys(item.sizes).length > 0 && selectedSizes.length === 0) {
        setValidationError('Escolha pelo menos um tamanho.');
        scrollToSection('sizes');
        return;
      }
      if (item.flavorOptions && Object.keys(item.flavorOptions).length > 0 && selectedFlavors.length === 0) {
        setValidationError('Escolha pelo menos um sabor.');
        scrollToSection('flavors');
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

    const modalContent = (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-0 md:p-6"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={contentRef}
            className="relative w-full md:w-auto md:max-w-5xl bg-white/95 backdrop-blur-md rounded-t-3xl md:rounded-2xl shadow-2xl border border-purple-200 flex flex-col max-h-[100dvh] md:max-h-[92vh] overflow-hidden"
            variants={modalVariants}
            onClick={e => e.stopPropagation()}
          >
            {/* gradiente topo decorativo */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />
                    {/* Hint flutuante mobile (dentro do modal agora) */}
                    <AnimatePresence>
                      {showScrollHint && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                          style={{ paddingTop: 'env(safe-area-inset-top)' }}
                        >
                          <div className="bg-purple-600/95 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                            <span>Role para baixo para ver as opções</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Cabeçalho Sticky */}
                    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 border-b bg-white/90 backdrop-blur rounded-t-3xl md:rounded-t-2xl">
                      <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent leading-tight tracking-tight">
                          {item.name}
                        </h3>
                        {itemCategory && <p className="text-[11px] mt-1 font-semibold uppercase tracking-wider text-purple-500">{itemCategory.label}</p>}
                      </div>
                      <motion.button
                        ref={closeButtonRef}
                        whileHover={{ rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 rounded-full bg-purple-100/70 hover:bg-purple-200 text-purple-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        aria-label="Fechar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </motion.button>
                    </div>

                    {/* Conteúdo Scrollável */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 custom-scrollbar">
                        <AnimatePresence>
                          {validationError && (
                            <motion.div
                              initial={{ y: -12, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -12, opacity: 0 }}
                              className="relative rounded-lg border border-amber-300 bg-amber-50/90 text-amber-800 px-4 py-3 shadow-sm text-sm flex items-start gap-3"
                              role="alert"
                            >
                              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-700 text-xs font-bold">!</span>
                              <div className="flex-1 leading-snug">
                                {validationError}
                                <button
                                  type="button"
                                  onClick={() => setValidationError(null)}
                                  className="ml-3 text-amber-700/80 hover:text-amber-900 font-medium text-xs underline"
                                >
                                  fechar
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* Hero / Imagem e descrição */}
                        <div className="grid md:grid-cols-5 gap-6">
                          {item.image && (
                            <div className="md:col-span-2">
                              <div className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-purple-200/70 shadow-sm group">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          )}
                          <div className={item.image ? 'md:col-span-3 flex flex-col' : 'md:col-span-5 flex flex-col'}>
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                              {item.description}
                            </p>
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="mt-4 bg-gradient-to-br from-purple-50 to-purple-100/40 border border-purple-200 rounded-lg p-4 text-xs md:text-sm shadow-sm">
                                <span className="font-semibold text-purple-700 block mb-1 tracking-wide">Ingredientes</span>
                                <p className="text-purple-700/80 leading-relaxed">{item.ingredients.join(', ')}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Coluna 1 */}
                            <div className="space-y-6">
                              {item.sizes && Object.keys(item.sizes).length > 0 && (
                                <div data-section="sizes" className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm focus-within:ring-2 focus-within:ring-purple-400/40">
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
                                          {isSelected && <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow">OK</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-3">Máximo de {maxSizes} tamanho(s).</div>
                                </div>
                              )}

                              {item.flavorOptions && Object.keys(item.flavorOptions).length > 0 && (
                                <div data-section="flavors" className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm focus-within:ring-2 focus-within:ring-purple-400/40">
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
                                          {isSelected && <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow">OK</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-3">Máximo de {maxFlavors} sabor(es).</div>
                                </div>
                              )}

                              {item.borderOptions && Object.keys(item.borderOptions).length > 0 && (
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm focus-within:ring-2 focus-within:ring-purple-400/40">
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
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm focus-within:ring-2 focus-within:ring-purple-400/40">
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
                                          {isSelected && <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow">OK</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-3">Máximo de {maxExtras} extra(s).</div>
                                </div>
                              )}

                              {itemCategory?.allowHalfAndHalf && allPizzas && (
                                <div data-section="meio" className={`p-5 rounded-xl border transition-all shadow-sm ${isHalf ? 'bg-purple-50 border-purple-400' : 'bg-gray-50 border-gray-200/80'} focus-within:ring-2 focus-within:ring-purple-400/40`}
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
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm focus-within:ring-2 focus-within:ring-purple-400/40">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">Quantidade</label>
                                  <div className="flex items-center justify-center gap-6">
                                    <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-11 h-11 rounded-full bg-white border border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600 transition">-</button>
                                    <span className="text-3xl font-bold tabular-nums text-purple-700">{quantity}</span>
                                    <button type="button" onClick={() => setQuantity(q => q + 1)} className="w-11 h-11 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-sm transition">+</button>
                                  </div>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm focus-within:ring-2 focus-within:ring-purple-400/40">
                                  <label className="block text-sm font-semibold text-gray-800 mb-4 tracking-wide">Observação</label>
                                  <textarea
                                    value={observation}
                                    onChange={(e) => setObservation(e.target.value)}
                                    placeholder="Ex: Sem cebola, bem passada..."
                                    className="form-input min-h-[120px] resize-y"
                                  />
                                </div>
                              </div>

                              {/* Botão Adicionar dentro da área de seleção */}
                              <div className="hidden md:block pt-2">
                                <motion.button
                                  whileHover={{ scale: 1.015 }}
                                  whileTap={{ scale: 0.97 }}
                                  type="submit"
                                  disabled={isHalf && (!half1 || !half2)}
                                  className="w-full px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg flex justify-between items-center text-lg"
                                >
                                  <span>Adicionar</span>
                                  <span>R$ {calculateTotal().toFixed(2)}</span>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                      {/* Barra fixa inferior mobile */}
                      <div className="md:hidden sticky bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-purple-100 px-5 py-4 flex items-center gap-4 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.08)]">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Total</span>
                          <span className="text-xl font-bold text-purple-700">R$ {calculateTotal().toFixed(2)}</span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          type="submit"
                          form="" // form implícito - botão dentro do mesmo escopo
                          disabled={isHalf && (!half1 || !half2)}
                          className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md hover:from-purple-700 hover:to-fuchsia-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          onClick={() => {
                            // disparar submit manual para garantir
                            const form = contentRef.current?.querySelector('form');
                            form && (form as HTMLFormElement).requestSubmit();
                          }}
                        >
                          Adicionar
                        </motion.button>
                      </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );

    if (!mounted) return null;
    return createPortal(modalContent, document.body);
}