// src/components/MenuDisplay.tsx

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenu } from '@/contexts/MenuContext';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaExclamationCircle, FaWhatsapp, FaShare } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';
import PastaModal from './PastaModal';
import { isRestaurantOpen as checkRestaurantOpen } from '../utils/timeUtils';
import type { BusinessHoursConfig } from '../utils/timeUtils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

const categoryVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

export default function MenuDisplay() {
    const [allowHalfAndHalf, setAllowHalfAndHalf] = useState(true);
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);
    const [selectedPasta, setSelectedPasta] = useState<MenuItem | null>(null);
    const [showCategoriesModal, setShowCategoriesModal] = useState(false);
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);

    useEffect(() => {
        async function fetchSettingsData() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setDeliveryFees(data.data.deliveryFees || []);
                    setAllowHalfAndHalf(data.data.allowHalfAndHalf === true);
                }
            } catch (err) {
                // erro silencioso
            }
        }
        fetchSettingsData();
    }, []);
    const categoriesContainerRef = useRef<HTMLDivElement>(null);
    const sectionMetaRef = useRef<{ value: string; el: HTMLElement; height: number; top: number; }[]>([]);
    const scrollingByClickRef = useRef(false);
    const lastSetRef = useRef<string | null>(null);
    const rAFRef = useRef<number | null>(null);
    const recomputeNeededRef = useRef(true);

    const { isOpen, toggleOpen } = useMenu();
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState<CartItem[]>([]);
    const [formaPagamento, setFormaPagamento] = useState<string>('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<{ _id?: string, value: string, label: string, allowHalfAndHalf?: boolean }[]>([]);
    const [catLoading, setCatLoading] = useState(false);
    const [catError, setCatError] = useState('');
    const [menuTitle, setMenuTitle] = useState("");
    const [menuSubtitle, setMenuSubtitle] = useState("");
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        const isModalOpen = selectedItem !== null || selectedPasta !== null;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [selectedItem, selectedPasta]);

    const recomputeSectionMeta = () => {
        sectionMetaRef.current = categories.map(cat => {
            const el = document.getElementById(`category-${cat.value}`) as HTMLElement | null;
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            return { value: cat.value, el, height: el.offsetHeight, top };
        }).filter(Boolean) as { value: string; el: HTMLElement; height: number; top: number; }[];
        recomputeNeededRef.current = false;
    };

    useEffect(() => {
        recomputeNeededRef.current = true;
    }, [categories, menuItems]);

    useEffect(() => {
        if (categories.length === 0) return;

        const anchorRatio = 0.25;
        const hysteresisAdvantage = 0.08;
        const lockDuration = 650;
        let lastCalc = 0;

        const calcActive = () => {
            rAFRef.current = null;
            if (scrollingByClickRef.current) return;
            if (recomputeNeededRef.current) recomputeSectionMeta();
            if (sectionMetaRef.current.length === 0) return;

            const viewportTop = window.scrollY;
            const viewportH = window.innerHeight;
            const anchorY = viewportTop + viewportH * anchorRatio;

            let bestValue = sectionMetaRef.current[0].value;
            let bestScore = -Infinity;

            sectionMetaRef.current.forEach(meta => {
                const { top, height } = meta;
                const bottom = top + height;
                const visible = Math.max(0, Math.min(bottom, viewportTop + viewportH) - Math.max(top, viewportTop));
                if (visible <= 0) return;
                const center = top + height / 2;
                const dist = Math.abs(center - anchorY);
                const normVis = visible / height;
                const score = normVis - dist / 2000;
                if (score > bestScore) {
                    bestScore = score;
                    bestValue = meta.value;
                }
            });

            if (lastSetRef.current && lastSetRef.current !== bestValue) {
                const prevMeta = sectionMetaRef.current.find(m => m.value === lastSetRef.current);
                if (prevMeta) {
                    const viewportTop2 = viewportTop;
                    const viewportH2 = viewportH;
                    const anchorY2 = anchorY;
                    const top = prevMeta.top; const height = prevMeta.height; const bottom = top + height;
                    const visible = Math.max(0, Math.min(bottom, viewportTop2 + viewportH2) - Math.max(top, viewportTop2));
                    const center = top + height / 2;
                    const dist = Math.abs(center - anchorY2);
                    const prevScore = (visible / height) - dist / 2000;
                    if (bestScore < prevScore + hysteresisAdvantage) {
                        return;
                    }
                }
            }

            if (bestValue !== lastSetRef.current) {
                lastSetRef.current = bestValue;
                setSelectedCategory(bestValue);
            }
        };

        const onScroll = () => {
            if (rAFRef.current) return;
            rAFRef.current = requestAnimationFrame(calcActive);
        };

        const initTimeout = setTimeout(() => {
            recomputeSectionMeta();
            calcActive();
        }, 200);

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => { recomputeNeededRef.current = true; onScroll(); }, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
            clearTimeout(initTimeout);
        };
    }, [categories, menuItems]);

    const refreshMenuData = async () => {
        try {
            const response = await fetch('/api/menu');
            const data = await response.json();
            if (data.success) {
                setMenuItems(data.data);
                setLastUpdate(new Date());
                setError(null);
            } else {
                setError('Erro ao atualizar o cardápio');
            }
        } catch (error) {
            console.error('Erro ao atualizar menu:', error);
            setError('Erro ao conectar com o servidor');
        }
    };

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/menu');
                const data = await response.json();
                if (data.success) {
                    setMenuItems(data.data);
                    setLastUpdate(new Date());
                } else {
                    setError('Erro ao carregar o cardápio');
                }
            } catch (error) {
                console.error('Erro ao carregar menu:', error);
                setError('Erro ao conectar com o servidor');
            } finally {
                setLoading(false);
            }
        };

        const fetchCategories = async () => {
            setCatLoading(true);
            setCatError('');
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success) {
                    const sorted = (data.data || []).slice().sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0));
                    setCategories(sorted);
                    if (sorted.length > 0) {
                        setSelectedCategory(sorted[0].value);
                    }
                } else {
                    setCatError(data.error || 'Falha ao buscar categorias.');
                }
            } catch (err) {
                setCatError('Falha ao buscar categorias.');
            } finally {
                setCatLoading(false);
            }
        };

        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setMenuTitle(data.data.menuTitle || "");
                    setMenuSubtitle(data.data.menuSubtitle || "");
                }
            } catch { }
        };

        fetchMenuItems();
        fetchCategories();
        fetchSettings();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            refreshMenuData();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // MELHORIA: Lógica de rolagem da categoria simplificada para sempre centralizar com animação.
    useEffect(() => {
        if (!selectedCategory || !categoriesContainerRef.current) return;
        const btn = categoriesContainerRef.current.querySelector(`[data-category="${selectedCategory}"]`) as HTMLElement | null;
        if (!btn) return;

        // A lógica de `scrollingByClickRef` no handler de clique já previne
        // que o scrollspy (rolagem automática) interfira durante o scroll iniciado pelo clique do usuário.
        // Portanto, podemos sempre chamar a rolagem suave aqui.
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [selectedCategory]);

    useEffect(() => {
        const savedTipoEntrega = localStorage.getItem('tipoEntrega') as 'entrega' | 'retirada';
        if (savedTipoEntrega) {
            setTipoEntrega(savedTipoEntrega);
        }

        const handleStorageChange = () => {
            const newTipoEntrega = localStorage.getItem('tipoEntrega') as 'entrega' | 'retirada';
            if (newTipoEntrega) {
                setTipoEntrega(newTipoEntrega);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(() => {
            const currentTipoEntrega = localStorage.getItem('tipoEntrega') as 'entrega' | 'retirada';
            if (currentTipoEntrega && currentTipoEntrega !== tipoEntrega) {
                setTipoEntrega(currentTipoEntrega);
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [tipoEntrega]);


    const handleCategoryClick = (category: string | null) => {
        setSelectedCategory(category);
        lastSetRef.current = category;
        const releaseLock = (delay = 450) => setTimeout(() => { scrollingByClickRef.current = false; }, delay);
        if (category) {
            const element = document.getElementById(`category-${category}`);
            if (element) {
                const offset = 140;
                const target = Math.max(0, element.offsetTop - offset);
                const startY = window.scrollY;
                scrollingByClickRef.current = true;
                window.scrollTo({ top: target, behavior: 'smooth' });
                const onWheel = (e: WheelEvent) => {
                    const goingUp = e.deltaY < 0;
                    const wantDown = target > startY;
                    const wantUp = target < startY;
                    if ((goingUp && wantDown) || (!goingUp && wantUp)) {
                        scrollingByClickRef.current = false;
                        window.removeEventListener('wheel', onWheel);
                    }
                };
                window.addEventListener('wheel', onWheel, { passive: true });
                releaseLock();
            }
        } else {
            scrollingByClickRef.current = true;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            releaseLock();
        }
    };

    const allPizzas = menuItems.filter(item => item.category === 'pizzas');

    useEffect(() => {
        async function fetchDeliveryFees() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setDeliveryFees(data.data.deliveryFees || []);
                    if (data.data.businessHours) {
                        const restaurantStatus = checkRestaurantOpen(data.data.businessHours as BusinessHoursConfig);
                        setIsRestaurantOpen(restaurantStatus);
                    } else {
                        setIsRestaurantOpen(false);
                    }
                }
            } catch (err) {
                setIsRestaurantOpen(false);
            }
        }
        fetchDeliveryFees();
    }, []);

    const handleCheckout = (orderId: string) => {
        setOrderSuccessId(orderId);
        setIsCartOpen(false);
        clearCart();
    };

    const handleAddToCart = (item: MenuItem, quantity: number, unitPrice: number, observation: string, size?: string, border?: string, extras?: string[], flavors?: string[]) => {
        addToCart(item, quantity, unitPrice, observation, size, border, extras, flavors);
        setSelectedItem(null);
        setIsCartOpen(true);
    };

    const handlePastaClick = (item: MenuItem) => {
        setSelectedPasta(item);
    };

    const handlePastaClose = () => {
        setSelectedPasta(null);
    };

    const handlePastaAddToCart = (quantity: number, observation: string, size?: 'P' | 'G') => {
        if (selectedPasta) {
            const unitPrice = selectedPasta.sizes?.[size || 'P'] || selectedPasta.price;
            addToCart(selectedPasta, quantity, unitPrice, observation, size, undefined, undefined, undefined);
            setSelectedPasta(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-gray-100 p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-800 text-lg">Carregando cardápio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100">
            <div className="sticky top-24 z-40">
                <div className="bg-white/90 backdrop-blur-sm py-2 mb-4 border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 relative">
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300/70 to-transparent" />
                        <motion.div
                            ref={categoriesContainerRef}
                            className="flex gap-2 overflow-x-auto py-2 no-scrollbar"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            {categories
                                .filter(category => category.value !== 'all' && category.value !== 'todas')
                                .map(category => {
                                    const active = selectedCategory === category.value;
                                    return (
                                        <motion.button
                                            key={category.value}
                                            data-category={category.value}
                                            onClick={() => handleCategoryClick(category.value)}
                                            whileTap={{ scale: 0.94 }}
                                            className={`group relative flex-shrink-0 whitespace-nowrap text-xs sm:text-sm font-semibold tracking-wide px-4 py-2 rounded-full transition-all duration-200 border ${active
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:text-purple-600 hover:border-purple-300'
                                                }`}
                                        >
                                            <span>{category.label}</span>
                                            {active && (
                                                <motion.span
                                                    layoutId="catGlow"
                                                    className="absolute inset-0 -z-10 rounded-full bg-purple-600/30 blur-lg"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-24">
                <div className="space-y-12">
                    {categories.map(category => (
                        <div key={category.value} id={`category-${category.value}`} className="space-y-5 scroll-mt-36">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 capitalize tracking-tight relative">
                                    <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{category.label}</span>
                                </h2>
                                <div className="flex-1 h-px bg-gradient-to-r from-purple-300/40 via-gray-200 to-transparent" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6">
                                {menuItems
                                    .filter(item => item.category === category.value)
                                    .map((item) => (
                                        <motion.div
                                            key={item._id}
                                            whileHover={{ y: -4 }}
                                            className="group bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:border-purple-200 transition-all duration-300 hover:shadow-md"
                                        >
                                            <div className="relative h-36 sm:h-48 overflow-hidden">
                                                <Image
                                                    src={item.image || '/placeholder.jpg'}
                                                    alt={item.name}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold bg-white/85 backdrop-blur-sm text-purple-700 border border-purple-200 shadow-sm">
                                                    R$ {(Number(item.price) || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                                                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 leading-snug line-clamp-1 group-hover:text-purple-700 transition-colors">{item.name}</h3>
                                                {item.description && (
                                                    <p className="text-gray-600/90 text-[11px] sm:text-sm leading-relaxed line-clamp-2 min-h-[2.2rem] sm:min-h-[2.5rem]">{item.description}</p>
                                                )}
                                                <div className="mt-auto flex items-center justify-end pt-1 sm:pt-2">
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="text-[11px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium shadow hover:from-purple-700 hover:to-purple-800 active:scale-95 transition-all"
                                                    >
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
                <AnimatePresence>
                    {selectedItem && (
                        <ItemModal
                            item={selectedItem}
                            onClose={() => setSelectedItem(null)}
                            onAddToCart={handleAddToCart}
                            allPizzas={allPizzas}
                            categories={categories}
                        />
                    )}
                    {selectedPasta && (
                        <PastaModal
                            item={selectedPasta}
                            onClose={handlePastaClose}
                            onAddToCart={handlePastaAddToCart}
                        />
                    )}
                    {isCartOpen && (
                        <Cart
                            items={cartItems}
                            onUpdateQuantity={updateQuantity}
                            onRemoveItem={removeFromCart}
                            onCheckout={handleCheckout}
                            onClose={() => setIsCartOpen(false)}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {cartItems.length > 0 && !isCartOpen && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={() => setIsCartOpen(true)}
                            className="fixed bottom-4 right-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-300 z-50"
                        >
                            <div className="flex items-center">
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="font-semibold">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}