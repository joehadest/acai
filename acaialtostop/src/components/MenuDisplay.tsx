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
    // Estado para permitir/desabilitar pizzas meio a meio
    const [allowHalfAndHalf, setAllowHalfAndHalf] = useState(true); // Padrão true para não quebrar
    // Buscar configuração allowHalfAndHalf junto com deliveryFees
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

    // Estados para dados da API
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<{ _id?: string, value: string, label: string }[]>([]);
    const [catLoading, setCatLoading] = useState(false);
    const [catError, setCatError] = useState('');
    const [menuTitle, setMenuTitle] = useState("");
    const [menuSubtitle, setMenuSubtitle] = useState("");

    // Carregar dados do menu e categorias da API
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/menu');
                const data = await response.json();
                if (data.success) {
                    setMenuItems(data.data);
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
                    // Ordena as categorias pelo campo 'order' antes de exibir
                    const sorted = (data.data || []).slice().sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0));
                    console.log('MenuDisplay - Categorias carregadas:', sorted);
                    setCategories(sorted);
                    // Inicializa a categoria selecionada após buscar
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

    // Scroll horizontal automático da barra de categorias
    useEffect(() => {
        if (!selectedCategory || !categoriesContainerRef.current) return;
        const btn = categoriesContainerRef.current.querySelector(`[data-category="${selectedCategory}"]`);
        if (btn && typeof (btn as HTMLElement).scrollIntoView === 'function') {
            (btn as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [selectedCategory]);

    // Efeito para sincronizar tipoEntrega com localStorage
    useEffect(() => {
        const savedTipoEntrega = localStorage.getItem('tipoEntrega') as 'entrega' | 'retirada';
        if (savedTipoEntrega) {
            setTipoEntrega(savedTipoEntrega);
        }

        // Listener para mudanças no localStorage (quando o usuário muda no Cart)
        const handleStorageChange = () => {
            const newTipoEntrega = localStorage.getItem('tipoEntrega') as 'entrega' | 'retirada';
            if (newTipoEntrega) {
                setTipoEntrega(newTipoEntrega);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Verificar mudanças no localStorage a cada segundo (fallback)
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
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);
    const [selectedPasta, setSelectedPasta] = useState<MenuItem | null>(null);
    const [showCategoriesModal, setShowCategoriesModal] = useState(false);
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);

    // Categorias agora vêm da API, não só dos itens
    const allPizzas = menuItems.filter(item => item.category === 'pizzas');
    // categoriesContainerRef já existe
    // Scroll horizontal automático da barra de categorias
    useEffect(() => {
        if (!selectedCategory || !categoriesContainerRef.current) return;
        const btn = categoriesContainerRef.current.querySelector(`[data-category="${selectedCategory}"]`);
        if (btn && typeof (btn as HTMLElement).scrollIntoView === 'function') {
            (btn as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (categories.length === 0) return;

        let isScrolling = false;
        let scrollTimeout: NodeJS.Timeout;

        // Função para verificar qual categoria está mais visível
        const checkVisibleCategory = () => {
            if (isScrolling) return;

            const categoryElements = categories.map(cat => ({
                element: document.getElementById(`category-${cat.value}`),
                value: cat.value
            })).filter(item => item.element);

            if (categoryElements.length === 0) return;

            let bestCategory = categories[0]?.value || 'pizzas';
            let bestVisibility = 0;
            const viewportCenter = window.innerHeight / 2;

            categoryElements.forEach(({ element, value }) => {
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const elementCenter = rect.top + rect.height / 2;

                    // Calcula a distância do centro do elemento ao centro da viewport
                    const distanceFromCenter = Math.abs(elementCenter - viewportCenter);

                    // Se o elemento está visível (pelo menos 30% visível)
                    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                    const visibility = Math.max(0, visibleHeight / element.offsetHeight);

                    if (visibility > 0.3) {
                        // Prefere elementos mais próximos do centro da viewport
                        const score = visibility / (1 + distanceFromCenter / 100);

                        if (score > bestVisibility) {
                            bestVisibility = score;
                            bestCategory = value;
                        }
                    }
                }
            });

            // Só atualiza se encontrou uma categoria válida
            if (bestVisibility > 0) {
                setSelectedCategory(bestCategory);
            }
        };

        // Listener para detectar scroll
        const handleScroll = () => {
            // Se está no topo, seleciona a primeira categoria
            if (window.scrollY < 150) {
                setSelectedCategory(categories[0]?.value || 'pizzas');
                return;
            }

            // Debounce para melhor performance
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                checkVisibleCategory();
            }, 50);
        };

        // Listener para detectar quando o usuário está fazendo scroll manual
        const handleScrollStart = () => {
            isScrolling = true;
            setTimeout(() => {
                isScrolling = false;
            }, 300);
        };

        // Adiciona os event listeners
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('scroll', handleScrollStart, { passive: true });

        // Executa uma verificação inicial
        setTimeout(checkVisibleCategory, 200);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scroll', handleScrollStart);
            clearTimeout(scrollTimeout);
        };
    }, [categories]);

    const handleCategoryClick = (category: string | null) => {
        setSelectedCategory(category);
        if (category) {
            const element = document.getElementById(`category-${category}`);
            if (element) {
                // Adiciona um offset para considerar a barra de navegação fixa
                const offset = 140; // Aumentado para dar mais espaço
                const elementPosition = element.offsetTop - offset;

                // Força o scroll para a posição correta
                window.scrollTo({
                    top: Math.max(0, elementPosition),
                    behavior: 'smooth'
                });
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
            if (notifyOrders.length === 0) return;
            for (const orderId of notifyOrders) {
                try {
                    const res = await fetch(`/api/pedidos/${orderId}`);
                    if (!res.ok) continue;
                    const data = await res.json();
                    const pedido = data.data || data;
                    if (!pedido || !pedido.status) continue;
                    localStorage.setItem(`notifyStatus_${orderId}`, pedido.status);
                } catch (e) { /* ignorar erros */ }
            }
        }, 5000); // 5 segundos
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Buscar taxas de entrega do banco
        async function fetchDeliveryFees() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    console.log('Taxas de entrega carregadas:', data.data.deliveryFees);
                    setDeliveryFees(data.data.deliveryFees || []);

                    // Verificar se o estabelecimento está aberto
                    if (data.data.businessHours) {
                        const restaurantStatus = checkRestaurantOpen(data.data.businessHours as BusinessHoursConfig);
                        setIsRestaurantOpen(restaurantStatus);

                        // Debug temporário
                        console.log('MenuDisplay - Status calculado:', restaurantStatus);
                        console.log('MenuDisplay - Configurações:', data.data.businessHours);
                    } else {
                        setIsRestaurantOpen(false);
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar taxas de entrega:', err);
                setIsRestaurantOpen(false);
            }
        }
        fetchDeliveryFees();
    }, []);

    const calculateDeliveryFee = (neighborhood: string, tipoEntrega: string) => {
        if (tipoEntrega === 'retirada') return 0;
        const deliveryFee = deliveryFees.find(fee => fee.neighborhood === neighborhood);
        return deliveryFee ? deliveryFee.fee : 0;
    };

    const handleAddToCart = (item: MenuItem, quantity: number, observation: string, size?: string, border?: string, extras?: string[]) => {
        let price = item.price;
        if (item.category === 'pizzas' && size && item.sizes) {
            const sizeKey = size as keyof typeof item.sizes;

            // Se for pizza meio a meio, pega o preço mais alto dos dois sabores
            if (observation && observation.includes('Meio a meio:')) {
                const meioAMeioText = observation.split('Meio a meio:')[1];
                // Remove observações adicionais após o slash (como "- Sem cebola")
                const cleanMeioAMeioText = meioAMeioText.split(' - ')[0];
                const [sabor1, sabor2] = cleanMeioAMeioText.split('/').map(s => s.trim());
                const pizzas = menuItems.filter((p: MenuItem) => p.category === 'pizzas');
                const pizza1 = pizzas.find((p: MenuItem) => p.name === sabor1);
                const pizza2 = pizzas.find((p: MenuItem) => p.name === sabor2);

                if (pizza1 && pizza2) {
                    const price1 = pizza1.sizes ? pizza1.sizes[sizeKey] || pizza1.price : pizza1.price;
                    const price2 = pizza2.sizes ? pizza2.sizes[sizeKey] || pizza2.price : pizza2.price;
                    price = Math.max(price1, price2);
                }
            } else {
                price = item.sizes[sizeKey] || price;
            }

            if (border && item.borderOptions) {
                const borderPrice = sizeKey === 'G' ? 8.00 : 4.00;
                price += borderPrice;
            }
            if (extras && item.extraOptions) {
                extras.forEach(extra => {
                    const extraPrice = item.extraOptions![extra];
                    if (extraPrice) {
                        price += extraPrice;
                    }
                });
            }
        }

        addToCart(item, quantity, observation, size, border, extras);
        setSelectedItem(null);
    };

    const handleCheckout = (orderId: string) => {
        setOrderSuccessId(orderId);
        setIsCartOpen(false);
        clearCart();
    };

    const calculateItemPrice = (item: CartItem) => {
        let price = item.item.price;

        // Se o item tem tamanhos (sizes) e um tamanho foi selecionado, usa o preço do tamanho
        if (item.size && item.item.sizes) {
            // Garante que o tamanho existe nas opções
            if (item.item.sizes[item.size as keyof typeof item.item.sizes]) {
                price = item.item.sizes[item.size as keyof typeof item.item.sizes] ?? price;
            }
        }

        // Lógica especial para pizzas meio a meio
        if (
            item.item.category === 'pizzas' &&
            item.size &&
            item.item.sizes &&
            item.observation &&
            item.observation.includes('Meio a meio:')
        ) {
            const sizeKey = item.size as keyof typeof item.item.sizes;
            const meioAMeioText = item.observation.split('Meio a meio:')[1];
            // Remove observações adicionais após o slash (como "- Sem cebola")
            const cleanMeioAMeioText = meioAMeioText.split(' - ')[0];
            const [sabor1, sabor2] = cleanMeioAMeioText.split('/').map(s => s.trim());
            const pizzas = menuItems.filter((p: MenuItem) => p.category === 'pizzas');
            const pizza1 = pizzas.find((p: MenuItem) => p.name === sabor1);
            const pizza2 = pizzas.find((p: MenuItem) => p.name === sabor2);
            if (pizza1 && pizza2) {
                const price1 = pizza1.sizes ? pizza1.sizes[sizeKey] ?? pizza1.price : pizza1.price;
                const price2 = pizza2.sizes ? pizza2.sizes[sizeKey] ?? pizza2.price : pizza2.price;
                price = Math.max(price1, price2);
            }
        }

        // Borda e extras (apenas para pizzas)
        if (item.item.category === 'pizzas' && item.size && item.item.sizes) {
            const sizeKey = item.size as keyof typeof item.item.sizes;
            if (item.border && item.item.borderOptions) {
                const borderPrice = sizeKey === 'G' ? 8.00 : 4.00;
                price += borderPrice;
            }
            if (item.extras && item.item.extraOptions) {
                item.extras.forEach(extra => {
                    const extraPrice = item.item.extraOptions![extra];
                    if (extraPrice) {
                        price += extraPrice;
                    }
                });
            }
        }

        return price * item.quantity;
    };

    const handleShareClick = () => {
        const customerName = localStorage.getItem('customerName') || '';
        const customerPhone = localStorage.getItem('customerPhone') || '';
        const customerAddress = localStorage.getItem('customerAddress') || '';
        const customerNeighborhood = localStorage.getItem('customerNeighborhood') || '';
        const customerComplement = localStorage.getItem('customerComplement') || '';
        const customerReferencePoint = localStorage.getItem('customerReferencePoint') || '';
        const customerNumber = localStorage.getItem('customerNumber') || '';
        const troco = localStorage.getItem('troco') || '';

        const deliveryFee = calculateDeliveryFee(customerNeighborhood, tipoEntrega);
        const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        const valorFinal = subtotal + deliveryFee;

        const customerInfo = `\nNome: ${customerName}\nTelefone: ${customerPhone}`;
        const addressInfo = tipoEntrega === 'entrega'
            ? `\nEndereço: ${customerAddress}, ${customerNumber}${customerComplement ? `, ${customerComplement}` : ''}\nBairro: ${customerNeighborhood}\nPonto de Referência: ${customerReferencePoint}`
            : '\nTipo de Entrega: Retirada no Local';
        const paymentInfo = formaPagamento === 'pix' ? '\nForma de Pagamento: PIX\n' :
            formaPagamento === 'dinheiro' ? `\nForma de Pagamento: Dinheiro${troco ? `\nTroco para: R$ ${troco}` : ''}\n` :
                formaPagamento === 'cartao' ? '\nForma de Pagamento: Cartão\n' : '';

        const itemsInfo = cartItems.map(item =>
            `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`
        ).join('\n');

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* 84 99872-9126`;

        if (navigator.share) {
            navigator.share({
                title: 'Meu Pedido',
                text: message
            });
        } else {
            alert('Compartilhamento não suportado neste navegador.');
        }
        setShowWhatsAppModal(false);
    };

    const handleWhatsAppClick = () => {
        const customerName = localStorage.getItem('customerName') || '';
        const customerPhone = localStorage.getItem('customerPhone') || '';
        const customerAddress = localStorage.getItem('customerAddress') || '';
        const customerNeighborhood = localStorage.getItem('customerNeighborhood') || '';
        const customerComplement = localStorage.getItem('customerComplement') || '';
        const customerReferencePoint = localStorage.getItem('customerReferencePoint') || '';
        const customerNumber = localStorage.getItem('customerNumber') || '';
        const troco = localStorage.getItem('troco') || '';

        const deliveryFee = calculateDeliveryFee(customerNeighborhood, tipoEntrega);
        const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        const valorFinal = subtotal + deliveryFee;

        const customerInfo = `\nNome: ${customerName}\nTelefone: ${customerPhone}`;
        const addressInfo = tipoEntrega === 'entrega'
            ? `\nEndereço: ${customerAddress}, ${customerNumber}${customerComplement ? `, ${customerComplement}` : ''}\nBairro: ${customerNeighborhood}\nPonto de Referência: ${customerReferencePoint}`
            : '\nTipo de Entrega: Retirada no Local';
        const paymentInfo = formaPagamento === 'pix' ? '\nForma de Pagamento: PIX\n' :
            formaPagamento === 'dinheiro' ? `\nForma de Pagamento: Dinheiro${troco ? `\nTroco para: R$ ${troco}` : ''}\n` :
                formaPagamento === 'cartao' ? '\nForma de Pagamento: Cartão\n' : '';

        const itemsInfo = cartItems.map(item =>
            `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`
        ).join('\n');

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* 84 99872-9126`;

        const whatsappUrl = `https://wa.me/558498729126?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setShowWhatsAppModal(false);
    };

    useEffect(() => {
        if (orderSuccessId) {
            const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
            if (!notifyOrders.includes(orderSuccessId)) {
                notifyOrders.push(orderSuccessId);
                localStorage.setItem('notifyOrders', JSON.stringify(notifyOrders));
            }
            setOrderSuccessId(null);
        }
    }, [orderSuccessId]);

    const handlePastaClick = (item: MenuItem) => {
        setSelectedPasta(item);
    };

    const handlePastaClose = () => {
        setSelectedPasta(null);
    };

    const handlePastaAddToCart = (quantity: number, observation: string, size?: 'P' | 'G') => {
        if (selectedPasta) {
            addToCart(selectedPasta, quantity, observation, size);
            setSelectedPasta(null);
        }
    };

    // Mapear nomes das categorias para exibição
    const getCategoryDisplayName = (category: string) => {
        const categoryNames: { [key: string]: string } = {
            'pizzas': 'Pizzas',
            'massas': 'Massas',
            'hamburguer': 'Hambúrgueres',
            'panquecas': 'Panquecas',
            'tapiocas': 'Tapiocas',
            'esfirras': 'Esfirras',
            'petiscos': 'Petiscos',
            'bebidas': 'Bebidas'
        };
        return categoryNames[category] || category;
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setShowCategoriesModal(false);
        setTimeout(() => {
            const element = document.getElementById(`category-${category}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50); // Pequeno delay para garantir que o scroll do body foi liberado
    };

    // Controlar scroll quando modal de categorias estiver aberto
    useEffect(() => {
        if (showCategoriesModal) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }, [showCategoriesModal]);



    if (!isOpen) {
        return (
            <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-purple-600 mb-4">Estabelecimento Fechado</h2>
                <p className="text-gray-400 mb-4">Desculpe, estamos fechados no momento.</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleOpen}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                    Abrir para Pedidos
                </motion.button>
            </div>
        );
    }

    // CORREÇÃO: Tela de Carregamento com tema claro
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

    // CORREÇÃO: Tela de Erro com tema claro
    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-gray-100 p-4">
                <div className="text-center">
                    <div className="text-purple-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Erro ao carregar cardápio</h2>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                    >
                        Tentar Novamente
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Barra de categorias */}
            <div className="sticky top-[112px] z-30 bg-gray-100/80 backdrop-blur-sm py-4 mb-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        ref={categoriesContainerRef}
                        className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-200"
                    >
                        {categories.map(category => (
                            <motion.button
                                key={category.value}
                                onClick={() => handleCategoryClick(category.value)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-colors shadow-sm ${selectedCategory === category.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category.label}
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Container do conteúdo */}
            <div className="max-w-7xl mx-auto px-4 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    {menuTitle && <h1 className="text-4xl font-bold text-gray-800 mb-2">{menuTitle}</h1>}
                    {menuSubtitle && <p className="text-gray-600">{menuSubtitle}</p>}
                </motion.div>

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
                                                    <span className="text-purple-600 font-bold text-lg">R$ {item.price.toFixed(2)}</span>
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
                            onAddToCart={(quantity, observation, size, border, extras) => {
                                addToCart(selectedItem, quantity, observation, size, border, extras);
                                setSelectedItem(null);
                            }}
                            allPizzas={menuItems.filter(i => i.category === 'pizzas')}
                            categories={categories}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedPasta && (
                        <PastaModal
                            item={selectedPasta}
                            onClose={handlePastaClose}
                            onAddToCart={handlePastaAddToCart}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
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

                {/* Modal do WhatsApp */}
                <AnimatePresence>
                    {showWhatsAppModal && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-[#262525] rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-center max-h-[90vh] overflow-y-auto"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                            >
                                <h2 className="text-2xl font-bold text-purple-600 mb-4">Confirme seu pedido</h2>
                                <div className="bg-[#1a1a1a] p-4 rounded-lg mb-6 text-left">
                                    <h3 className="text-purple-600 font-semibold mb-2">Detalhes do seu pedido:</h3>
                                    <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                                        {(() => {
                                            const customerName = localStorage.getItem('customerName') || '';
                                            const customerPhone = localStorage.getItem('customerPhone') || '';
                                            const customerAddress = localStorage.getItem('customerAddress') || '';
                                            const customerNeighborhood = localStorage.getItem('customerNeighborhood') || '';
                                            const customerComplement = localStorage.getItem('customerComplement') || '';
                                            const customerReferencePoint = localStorage.getItem('customerReferencePoint') || '';
                                            const customerNumber = localStorage.getItem('customerNumber') || '';
                                            const troco = localStorage.getItem('troco') || '';

                                            const deliveryFee = calculateDeliveryFee(customerNeighborhood, tipoEntrega);
                                            const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
                                            const valorFinal = subtotal + deliveryFee;

                                            const customerInfo = `\nNome: ${customerName}\nTelefone: ${customerPhone}`;
                                            const addressInfo = tipoEntrega === 'entrega'
                                                ? `\nEndereço: ${customerAddress}, ${customerNumber}${customerComplement ? `, ${customerComplement}` : ''}\nBairro: ${customerNeighborhood}\nPonto de Referência: ${customerReferencePoint}`
                                                : '\nTipo de Entrega: Retirada no Local';
                                            const paymentInfo = formaPagamento === 'pix' ? '\nForma de Pagamento: PIX\n' :
                                                formaPagamento === 'dinheiro' ? `\nForma de Pagamento: Dinheiro${troco ? `\nTroco para: R$ ${troco}` : ''}\n` :
                                                    formaPagamento === 'cartao' ? '\nForma de Pagamento: Cartão\n' : '';

                                            const itemsInfo = cartItems.map(item =>
                                                `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`
                                            ).join('\n');

                                            return `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* 84 99872-9126`;
                                        })()}
                                    </pre>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleWhatsAppClick}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <FaWhatsapp className="text-xl" />
                                        Enviar para WhatsApp
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowWhatsAppModal(false)}
                                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de sucesso do pedido */}
                <AnimatePresence>
                    {orderSuccessId && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-[#262525] rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                            >
                                <h2 className="text-2xl font-bold text-purple-600 mb-4">Pedido realizado com sucesso!</h2>
                                <p className="text-gray-300 mb-2">Anote o número do seu pedido para acompanhar em <b>Pedidos</b>:</p>
                                <div className="text-3xl font-bold text-purple-500 mb-4 break-all max-w-full" style={{ wordBreak: 'break-all' }}>{orderSuccessId}</div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 mt-2"
                                    onClick={() => {
                                        setOrderSuccessId(null);
                                    }}
                                >
                                    OK
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {cartItems.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={() => setIsCartOpen(true)}
                            className="fixed bottom-4 right-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-300"
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
            {/* Painel de Debug - Removido */}
        </div>
    );
}