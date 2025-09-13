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

        // Cleanup function to restore scroll on component unmount
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [selectedItem, selectedPasta]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const category = entry.target.id.replace('category-', '');
                        setSelectedCategory(category);
                    }
                });
            },
            {
                rootMargin: '-20% 0px -80% 0px',
                threshold: 0
            }
        );

        const categoryElements = categories.map(cat => document.getElementById(`category-${cat.value}`)).filter(Boolean);
        categoryElements.forEach(el => observer.observe(el!));

        return () => {
            categoryElements.forEach(el => observer.unobserve(el!));
        };
    }, [categories]);

    // Função para recarregar dados do menu
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

    // Atualização automática dos dados do menu a cada 30 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            refreshMenuData();
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!selectedCategory || !categoriesContainerRef.current) return;
        const btn = categoriesContainerRef.current.querySelector(`[data-category="${selectedCategory}"]`);
        if (btn && typeof (btn as HTMLElement).scrollIntoView === 'function') {
            (btn as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
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
        if (category) {
            const element = document.getElementById(`category-${category}`);
            if (element) {
                const offset = 140; 
                const elementPosition = element.offsetTop - offset;
                window.scrollTo({
                    top: Math.max(0, elementPosition),
                    behavior: 'smooth'
                });
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const allPizzas = menuItems.filter(item => item.category === 'pizzas');

    useEffect(() => {
        if (categories.length === 0) return;

        let scrollTimeout: NodeJS.Timeout;

        const checkVisibleCategory = () => {
            const categoryElements = categories.map(cat => ({
                element: document.getElementById(`category-${cat.value}`),
                value: cat.value
            })).filter(item => item.element);

            if (categoryElements.length === 0) return;

            let bestCategory = categories[0]?.value || '';
            let bestVisibility = 0;
            const viewportCenter = window.innerHeight / 2;

            categoryElements.forEach(({ element, value }) => {
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const elementCenter = rect.top + rect.height / 2;
                    const distanceFromCenter = Math.abs(elementCenter - viewportCenter);

                    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                    const visibility = Math.max(0, visibleHeight / element.offsetHeight);

                    if (visibility > 0.3) {
                        const score = visibility / (1 + distanceFromCenter / 100);
                        if (score > bestVisibility) {
                            bestVisibility = score;
                            bestCategory = value;
                        }
                    }
                }
            });

            if (bestVisibility > 0 && bestCategory !== selectedCategory) {
                setSelectedCategory(bestCategory);
            }
        };

        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                checkVisibleCategory();
            }, 50);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        setTimeout(checkVisibleCategory, 200);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [categories, selectedCategory]);

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
    
    // CORREÇÃO AQUI: Adicionado o parâmetro `flavors`
    const handleAddToCart = (item: MenuItem, quantity: number, unitPrice: number, observation: string, size?: string, border?: string, extras?: string[], flavors?: string[]) => {
        addToCart(item, quantity, unitPrice, observation, size, border, extras, flavors);
        setSelectedItem(null);
        setIsCartOpen(true); // Abre o carrinho ao adicionar
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
            <div className="min-h-[60vh] flex items-center justify-center bg-transparent p-4">
                <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-purple-100/50">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
                    <p className="text-gray-800 text-xl font-semibold">Carregando cardápio...</p>
                    <p className="text-gray-600 text-sm mt-2">Preparando as delícias para você</p>
                </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-transparent">
            <div className="sticky top-0 z-40">
              <div className="bg-white/80 backdrop-blur-md py-3 mb-6 border border-purple-100/50 shadow-lg rounded-2xl mx-2"> 
                <div className="max-w-7xl mx-auto px-3 sm:px-4 relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                    <motion.div
                        ref={categoriesContainerRef}
                            className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
                        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
                    >
                        {categories.map(category => (
                            <motion.button
                                key={category.value}
                                data-category={category.value}
                                onClick={() => handleCategoryClick(category.value)}
                                className={`relative px-4 py-2 rounded-md whitespace-nowrap flex-shrink-0 text-xs font-semibold tracking-wide transition-colors ${selectedCategory === category.value
                                    ? 'text-purple-700 bg-purple-50'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="uppercase">{category.label}</span>
                                {selectedCategory === category.value && (
                                  <motion.span layoutId="catUnderline" className="absolute left-2 right-2 -bottom-1 h-[3px] rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500" />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-24">
                <div className="space-y-12">
                    {categories.map(category => (
                        <div key={category.value} id={`category-${category.value}`} className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent capitalize mb-2">{category.label}</h2>
                                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mx-auto"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {menuItems
                                    .filter(item => item.category === category.value)
                                    .map((item) => (
                                        <motion.div
                                            key={item._id}
                                            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-purple-100/50 group"
                                            whileHover={{ y: -5 }}
                                        >
                                            <div className="relative h-56 overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                                                <Image
                                                    src={item.image || '/placeholder.jpg'}
                                                    alt={item.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="p-6 relative">
                                                <div className="absolute -top-4 left-6 right-6 h-8 bg-gradient-to-b from-white/80 to-transparent rounded-t-2xl"></div>
                                                <h3 className="text-2xl font-bold text-gray-800 mb-3 leading-tight">{item.name}</h3>
                                                <p className="text-gray-600 mb-4 h-12 overflow-hidden text-sm leading-relaxed">{item.description}</p>
                                                <div className="flex justify-between items-center pt-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preço</span>
                                                        <span className="text-purple-600 font-bold text-2xl">R$ {(Number(item.price) || 0).toFixed(2)}</span>
                                                    </div>
                                                    <motion.button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Adicionar
                                                    </motion.button>
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
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            onClick={() => setIsCartOpen(true)}
                            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-2xl shadow-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 z-50 border border-purple-500/30"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="flex items-center backdrop-blur-sm">
                                <div className="relative mr-3">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-purple-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                                        {cartItems.reduce((total, item) => total + item.quantity, 0)}
                                    </div>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold text-sm">Ver Carrinho</span>
                                    <span className="text-xs text-purple-100">
                                        R$ {cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}