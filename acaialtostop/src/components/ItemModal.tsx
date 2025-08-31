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
                className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                variants={overlayVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}
            >
                <motion.div
                    className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto text-gray-900"
                    variants={modalVariants} onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-gray-400 hover:text-gray-700" onClick={onClose}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </motion.button>
                    </div>

                    {item.image && <div className="relative h-48 mb-4"><img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /></div>}
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {item.ingredients && item.ingredients.length > 0 && <div className="bg-gray-100 p-4 rounded-lg"><label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes</label><p className="text-gray-500 text-sm">{item.ingredients.join(', ')}</p></div>}
                        
                        {item.sizes && Object.keys(item.sizes).length > 0 && (
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-3">{item.sizesTitle || 'Tamanhos'}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(item.sizes).map(([sizeKey, price]) => {
                                        const isSelected = selectedSizes.includes(sizeKey);
                                        const isDisabled = !isSelected && selectedSizes.length >= maxSizes;
                                        return (
                                            <button
                                                key={sizeKey}
                                                type="button"
                                                onClick={() => toggleSize(sizeKey)}
                                                disabled={isDisabled}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${isSelected ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-600 text-gray-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="font-semibold">{sizeKey}</div>
                                                <div className="text-sm">{price > 0 ? `+ R$ ${price.toFixed(2)}` : 'Incluído'}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Máximo de {maxSizes} tamanhos por pedido.</div>
                            </div>
                        )}

                        {item.flavorOptions && Object.keys(item.flavorOptions).length > 0 && (
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-3">{item.flavorsTitle || 'Sabores'}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(item.flavorOptions).map(([flavorKey, price]) => {
                                        const isSelected = selectedFlavors.includes(flavorKey);
                                        const isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;
                                        return (
                                            <button
                                                key={flavorKey}
                                                type="button"
                                                onClick={() => toggleFlavor(flavorKey)}
                                                disabled={isDisabled}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${isSelected ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-600 text-gray-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="font-semibold">{flavorKey}</div>
                                                <div className="text-sm">{price > 0 ? `+ R$ ${price.toFixed(2)}` : 'Incluído'}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Máximo de {maxFlavors} sabores por pedido.</div>
                            </div>
                        )}
                        
                        {itemCategory?.allowHalfAndHalf && allPizzas && (
                            <div className={`p-4 rounded-lg transition-all duration-300 ${isHalf ? 'bg-purple-50 border-2 border-purple-400' : 'bg-gray-100 border border-gray-200'}`}>
                                <label className="flex items-center gap-3 mb-3 cursor-pointer group">
                                    <input type="checkbox" checked={isHalf} onChange={e => setIsHalf(e.target.checked)} className="form-checkbox h-6 w-6 text-purple-600 bg-gray-200 border-gray-400 rounded focus:ring-purple-500"/>
                                    <span className={`text-lg font-medium ${isHalf ? 'text-purple-700' : 'text-gray-700'}`}>Montar Meio a Meio</span>
                                </label>
                                {isHalf && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3"><select className="form-input" value={half1?.name || ''} onChange={e => setHalf1(allPizzas.find(p => p.name === e.target.value) || null)}>{allPizzas.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}</select><select className="form-input" value={half2?.name || ''} onChange={e => setHalf2(allPizzas.find(p => p.name === e.target.value) || null)}><option value="">Selecione o 2º sabor</option>{allPizzas.filter(p => p.name !== half1?.name).map(p => <option key={p._id} value={p.name}>{p.name}</option>)}</select></motion.div>}
                            </div>
                        )}

                        {item.borderOptions && Object.keys(item.borderOptions).length > 0 && (
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-3">{item.borderTitle || 'Borda'}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setSelectedBorder('')} className={`p-3 rounded-lg border-2 transition-all ${!selectedBorder ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-600 text-gray-700'}`}><div className="font-semibold">Sem Borda</div></button>
                                    {Object.entries(item.borderOptions).map(([key, value]) => <button key={key} type="button" onClick={() => setSelectedBorder(key)} className={`p-3 rounded-lg border-2 transition-all ${selectedBorder === key ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-600 text-gray-700'}`}><div className="font-semibold">{key}</div><div className="text-sm">+ R$ {value.toFixed(2)}</div></button>)}
                                </div>
                            </div>
                        )}

                        {item.extraOptions && Object.keys(item.extraOptions).length > 0 && (
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-3">{item.extrasTitle || 'Extras'}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(item.extraOptions).map(([key, value]) => {
                                        const isSelected = selectedExtras.includes(key);
                                        const isDisabled = !isSelected && selectedExtras.length >= maxExtras;
                                        return <button key={key} type="button" onClick={() => toggleExtra(key)} className={`p-3 rounded-lg border-2 transition-all ${isSelected ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-600 text-gray-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isDisabled}><div className="font-semibold">{key}</div><div className="text-sm">+ R$ {value.toFixed(2)}</div></button>;
                                    })}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Máximo de {maxExtras} extras por pedido.</div>
                            </div>
                        )}

                        <div className="bg-gray-100 p-4 rounded-lg"><label className="block text-sm font-medium text-gray-700 mb-3">Quantidade</label><div className="flex items-center justify-center gap-4"><button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700">-</button><span className="text-2xl font-bold">{quantity}</span><button type="button" onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white">+</button></div></div>
                        <div className="bg-gray-100 p-4 rounded-lg"><label className="block text-sm font-medium text-gray-700 mb-3">Observação (opcional)</label><textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex: Sem cebola, bem passada..." className="form-input" rows={3}/></div>
                        <div className="flex justify-between items-center pt-4">
                            <div><span className="text-sm text-gray-500">Total</span><div className="text-2xl font-bold text-purple-600">R$ {calculateTotal().toFixed(2)}</div></div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-8 py-3 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400" disabled={isHalf && (!half1 || !half2)}>Adicionar</motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}