// src/components/MenuDisplay.tsx

'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import { isRestaurantOpen as checkRestaurantOpen } from '../utils/timeUtils';
import type { BusinessHoursConfig } from '../utils/timeUtils';

// Hook com alta precisão para observar a categoria visível (CORRIGIDO)
function useVisibleCategory(categories: { value: string }[]) {
    const [visibleCategory, setVisibleCategory] = React.useState<string | null>(null);
    const observerRef = React.useRef<IntersectionObserver | null>(null);
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        // Define a primeira categoria como padrão na montagem inicial
        if (categories.length > 0 && !visibleCategory) {
            setVisibleCategory(categories[0].value);
        }
    }, [categories]);

    React.useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                // Encontra a entrada mais visível que está mais acima na tela
                const topVisibleEntry = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

                if (topVisibleEntry) {
                    const newCategory = topVisibleEntry.target.id.replace('category-', '');

                    // Debounce para evitar atualizações rápidas durante o scroll
                    if (debounceRef.current) clearTimeout(debounceRef.current);

                    debounceRef.current = setTimeout(() => {
                        setVisibleCategory(newCategory);
                    }, 150); // Atraso de 150ms para estabilizar
                }
            },
            {
                rootMargin: '-80px 0px -50% 0px', // Área de deteção otimizada para o topo
                threshold: 0,
            }
        );

        const elements = categories.map(category => document.getElementById(`category-${category.value}`)).filter(Boolean);
        elements.forEach(element => observerRef.current!.observe(element!));

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [categories]); // Recria o observador apenas se a lista de categorias mudar

    return visibleCategory;
}


export default function MenuDisplay() {
    const [allowHalfAndHalf, setAllowHalfAndHalf] = React.useState(true);
    const [deliveryFees, setDeliveryFees] = React.useState<{ neighborhood: string; fee: number }[]>([]);
    const [isRestaurantOpen, setIsRestaurantOpen] = React.useState(true);
    const categoriesContainerRef = React.useRef<HTMLDivElement>(null);
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null);
    const [isCartOpen, setIsCartOpen] = React.useState(false);
    const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [categories, setCategories] = React.useState<{ _id?: string, value: string, label: string, allowHalfAndHalf?: boolean }[]>([]);
    const visibleCategory = useVisibleCategory(categories);
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    // Efeito para rolar a barra de categorias e manter o item ativo visível
    React.useEffect(() => {
        if (visibleCategory && categoriesContainerRef.current) {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

            scrollTimeoutRef.current = setTimeout(() => {
                const activeButton = categoriesContainerRef.current?.querySelector(`[data-category-value="${visibleCategory}"]`) as HTMLElement;
                if (activeButton && categoriesContainerRef.current) {
                    const container = categoriesContainerRef.current;
                    const containerRect = container.getBoundingClientRect();
                    const buttonRect = activeButton.getBoundingClientRect();
                    
                    const isButtonVisible = buttonRect.left >= containerRect.left && buttonRect.right <= containerRect.right;
                    
                    if (!isButtonVisible) {
                        const scrollOffset = (buttonRect.left + buttonRect.width / 2) - (containerRect.left + containerRect.width / 2);
                        container.scrollBy({ left: scrollOffset, behavior: 'smooth' });
                    }
                }
            }, 150);
        }

        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, [visibleCategory]);

    React.useEffect(() => {
        async function fetchInitialData() {
            try {
                setLoading(true);
                const [menuRes, catRes, settingsRes] = await Promise.all([
                    fetch('/api/menu'),
                    fetch('/api/categories'),
                    fetch('/api/settings'),
                ]);

                const menuData = await menuRes.json();
                if (menuData.success) setMenuItems(menuData.data);
                else setError('Erro ao carregar o cardápio');

                const catData = await catRes.json();
                if (catData.success) {
                    const sorted = (catData.data || []).slice().sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0));
                    setCategories(sorted);
                } else {
                    setError(prev => prev ? prev + ' e categorias.' : 'Erro ao carregar categorias.');
                }

                const settingsData = await settingsRes.json();
                if (settingsData.success && settingsData.data) {
                    setDeliveryFees(settingsData.data.deliveryFees || []);
                    setAllowHalfAndHalf(settingsData.data.allowHalfAndHalf === true);
                    if (settingsData.data.businessHours) {
                        setIsRestaurantOpen(checkRestaurantOpen(settingsData.data.businessHours as BusinessHoursConfig));
                    }
                }
            } catch (err) {
                setError('Erro de conexão. Não foi possível carregar os dados.');
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, []);

    const handleCategoryClick = (categoryValue: string) => {
        const element = document.getElementById(`category-${categoryValue}`);
        const offset = 80;
        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: elementPosition, behavior: 'smooth' });
        }
    };
    
    const allPizzas = menuItems.filter(item => item.category === 'pizzas');

    const handleCheckout = (orderId: string) => {
        setIsCartOpen(false);
        clearCart();
    };

    const handleAddToCart = (item: MenuItem, quantity: number, unitPrice: number, observation: string, size?: string, border?: string, extras?: string[], flavors?: string[]) => {
        addToCart(item, quantity, unitPrice, observation, size, border, extras, flavors);
        setSelectedItem(null);
        setIsCartOpen(true);
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
    
    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100">
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm py-2 mb-4 border-b border-gray-200 shadow-sm z-30">
                <div className="max-w-7xl mx-auto px-3 sm:px-4">
                    <div ref={categoriesContainerRef} className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                        {categories.map(category => {
                            const isActive = visibleCategory === category.value;
                            return (
                                <button
                                    key={category.value}
                                    data-category-value={category.value}
                                    onClick={() => handleCategoryClick(category.value)}
                                    className={`flex-shrink-0 whitespace-nowrap text-xs sm:text-sm font-semibold tracking-wide px-4 py-2 rounded-full transition-all duration-300 border ${
                                        isActive
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                            : 'bg-white border-transparent text-gray-700 hover:text-purple-600'
                                    }`}
                                >
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-24">
                <div className="space-y-12">
                    {categories.map(category => (
                        <div key={category.value} id={`category-${category.value}`} className="space-y-5 scroll-mt-24">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 capitalize tracking-tight">
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