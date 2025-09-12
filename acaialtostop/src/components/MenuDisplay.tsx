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
            <div className="min-h-[60vh] flex items-center justify-center bg-gray-100 p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-800 text-lg">Carregando cardápio...</p>
                </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-gray-100">
            <div className="sticky top-0 z-40">
              <div className="bg-white/95 backdrop-blur-sm py-2 mb-4 border-b border-gray-200 shadow-sm rounded-xl"> 
                <div className="max-w-7xl mx-auto px-3 sm:px-4 relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
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
                        <div key={category.value} id={`category-${category.value}`} className="space-y-4">
                            <h2 className="text-3xl font-bold text-gray-800 capitalize">{category.label}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {menuItems
                                    .filter(item => item.category === category.value)
                                    .map((item) => (
                                        <motion.div
                                            key={item._id}
                                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200"
                                        >
                                            <div className="relative h-48">
                                                <Image
                                                    src={item.image || '/placeholder.jpg'}
                                                    alt={item.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
                                                <p className="text-gray-600 mb-4 h-12 overflow-hidden text-sm">{item.description}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-purple-600 font-bold text-lg">R$ {(Number(item.price) || 0).toFixed(2)}</span>
                                                    <motion.button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
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