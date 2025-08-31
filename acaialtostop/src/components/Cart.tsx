// src/components/Cart.tsx

'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../types/cart';
import { FaTrash, FaTimes, FaMotorcycle, FaShoppingBag, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import WhatsAppModal from './WhatsAppModal';

// Hook para detectar se a tela é de um dispositivo móvel
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 768); // Tailwind 'md' breakpoint
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    return isMobile;
};


interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (itemId: string, quantity: number) => void;
    onRemoveItem: (itemId: string) => void;
    onCheckout: (orderId: string) => void;
    onClose: () => void;
}

const Cart = ({ items, onUpdateQuantity, onRemoveItem, onCheckout, onClose }: CartProps) => {
    const { clearCart } = useCart();
    const [step, setStep] = useState<'review' | 'checkout'>('review');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
    const [customerAddress, setCustomerAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', referencePoint: '' });
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);
    const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
    const [troco, setTroco] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [whatsappLink, setWhatsappLink] = useState('');
    const [successfulOrderId, setSuccessfulOrderId] = useState<string | null>(null);
    
    const [hasMounted, setHasMounted] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        setCustomerName(localStorage.getItem('customerName') || '');
        setCustomerPhone(localStorage.getItem('customerPhone') || '');
        const savedAddress = localStorage.getItem('customerAddress');
        if (savedAddress) setCustomerAddress(JSON.parse(savedAddress));
        const savedTipoEntrega = localStorage.getItem('tipoEntrega');
        if (savedTipoEntrega === 'retirada' || savedTipoEntrega === 'entrega') {
            setTipoEntrega(savedTipoEntrega);
        }
    }, []);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success) {
                    setDeliveryFees(data.data.deliveryFees || []);
                    setWhatsappNumber(data.data.whatsappNumber || '');
                }
            } catch (err) {
                console.error("Erro ao buscar taxas de entrega:", err);
            }
        }
        fetchSettings();
    }, []);

    const deliveryFee = useMemo(() => {
        if (tipoEntrega === 'retirada' || !customerAddress.neighborhood) return 0;
        const fee = deliveryFees.find(f => f.neighborhood === customerAddress.neighborhood);
        return fee ? fee.fee : 0;
    }, [tipoEntrega, customerAddress.neighborhood, deliveryFees]);

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
    const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

    const handleSaveAndCheckout = async () => {
        setError('');
        if (!customerName || !customerPhone) {
            setError('Nome e telefone são obrigatórios.');
            return;
        }
        if (tipoEntrega === 'entrega' && (!customerAddress.street || !customerAddress.number || !customerAddress.neighborhood)) {
            setError('Bairro, Rua e Número são obrigatórios para entrega.');
            return;
        }

        setIsSaving(true);

        localStorage.setItem('customerName', customerName);
        localStorage.setItem('customerPhone', customerPhone);
        localStorage.setItem('customerAddress', JSON.stringify(customerAddress));
        localStorage.setItem('tipoEntrega', tipoEntrega);

        const pedido = {
            itens: items.map(i => ({
                nome: i.item.name,
                quantidade: i.quantity,
                preco: i.price,
                observacao: i.observation,
                size: i.size,
                border: i.border,
                extras: i.extras,
                flavors: i.flavors, // Adicionado
                // Adicionando os títulos customizados
                sizesTitle: i.item.sizesTitle,
                flavorsTitle: i.item.flavorsTitle, // Adicionado
                borderTitle: i.item.borderTitle,
                extrasTitle: i.item.extrasTitle,
            })),
            total: total,
            tipoEntrega: tipoEntrega,
            endereco: tipoEntrega === 'entrega' ? { address: customerAddress, deliveryFee } : undefined,
            cliente: { nome: customerName, telefone: customerPhone },
            formaPagamento: formaPagamento,
            status: 'pendente',
            data: new Date().toISOString(),
            troco: formaPagamento === 'dinheiro' ? troco : undefined,
        };

        try {
            const res = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido),
            });
            const data = await res.json();
            if (data.success) {
                const message = `Olá, gostaria de fazer o seguinte pedido:\n\n` +
                `*Pedido #${data.pedidoId}*\n\n` +
                `*Cliente:*\n` +
                `Nome: ${customerName}\n` +
                `Telefone: ${customerPhone}\n\n` +
                `*Itens:*\n` +
                items.map(i => {
                    let itemDetails = `${i.quantity}x ${i.item.name} (R$ ${i.price.toFixed(2)})`;
                    if (i.size) itemDetails += `\n  - ${i.item.sizesTitle || 'Tamanho'}: ${i.size}`;
                    if (i.flavors && i.flavors.length > 0) itemDetails += `\n  - ${i.item.flavorsTitle || 'Sabores'}: ${i.flavors.join(', ')}`;
                    if (i.border) itemDetails += `\n  - ${i.item.borderTitle || 'Borda'}: ${i.border}`;
                    if (i.extras && i.extras.length > 0) itemDetails += `\n  - ${i.item.extrasTitle || 'Extras'}: ${i.extras.join(', ')}`;
                    if (i.observation) itemDetails += `\n  - Observação: ${i.observation}`;
                    return itemDetails;
                }).join('\n\n') + `\n\n` +
                `*Subtotal:* R$ ${subtotal.toFixed(2)}\n` +
                (tipoEntrega === 'entrega' ? `*Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}\n` : '') +
                `*Total:* R$ ${total.toFixed(2)}\n\n` +
                `*Forma de Pagamento:* ${formaPagamento}${formaPagamento === 'dinheiro' && troco ? ` (Troco para R$ ${troco})` : ''}\n\n` +
                (tipoEntrega === 'entrega' ?
                    `*Entregar em:*\n` +
                    `Rua: ${customerAddress.street}, ${customerAddress.number}\n` +
                    (customerAddress.complement ? `Complemento: ${customerAddress.complement}\n` : '') +
                    `Bairro: ${customerAddress.neighborhood}\n` +
                    (customerAddress.referencePoint ? `Ponto de Referência: ${customerAddress.referencePoint}\n` : '')
                    : `*Tipo de Entrega:* Retirada no local\n`) +
                `\n*Observações Gerais:* ${pedido.itens.map(i => i.observacao).filter(Boolean).join(', ')}`;
                const encodedMessage = encodeURIComponent(message);
                const link = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
                setWhatsappLink(link);
                setSuccessfulOrderId(data.pedidoId); // Salva o ID do pedido
                setShowWhatsAppModal(true); // Apenas abre o modal
            } else {
                setError(data.message || 'Erro ao criar o pedido.');
            }
        } catch (err) {
            setError('Erro de conexão ao finalizar o pedido.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseWhatsAppModal = () => {
        setShowWhatsAppModal(false);
        if (successfulOrderId) {
            onCheckout(successfulOrderId);
            clearCart();
        }
    };

    const pageVariants = {
        initial: (direction: number) => ({ x: `${direction * 100}%`, opacity: 0 }),
        animate: { x: 0, opacity: 1 },
        exit: (direction: number) => ({ x: `${direction * -100}%`, opacity: 0 }),
    };

    const mobileContainerVariants = {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" }
    };

    const desktopContainerVariants = {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" }
    };

    if (!hasMounted) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-stretch md:justify-end"
            onClick={onClose}
        >
            <motion.div
                variants={isMobile ? mobileContainerVariants : desktopContainerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 350, damping: 40 }}
                className="w-full md:max-w-md h-[90vh] md:h-full bg-white text-gray-900 flex flex-col rounded-t-2xl md:rounded-t-none overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex justify-between items-center border-b border-gray-200 flex-shrink-0">
                    {step === 'checkout' ? (
                        <button onClick={() => setStep('review')} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><FaArrowLeft /></button>
                    ) : (
                        <div className="w-8"></div>
                    )}
                    <h2 className="text-xl font-bold text-purple-600 text-center">{step === 'review' ? 'Seu Carrinho' : 'Finalizar Pedido'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><FaTimes /></button>
                </header>

                <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence initial={false} custom={step === 'review' ? -1 : 1}>
                        {step === 'review' && (
                            <motion.div
                                key="review"
                                custom={-1}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                                className="absolute inset-0 p-4 overflow-y-auto"
                            >
                                {items.length === 0 ? (
                                    <p className="text-center text-gray-400 pt-10">Seu carrinho está vazio.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map(item => (
                                            <div key={item._id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                                                <img src={item.item.image || '/placeholder.jpg'} alt={item.item.name} className="w-16 h-16 md:w-20 md:h-20 rounded-md object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-gray-900 pr-2">{item.quantity}x {item.item.name}</h3>
                                                        <span className="font-semibold text-purple-600 whitespace-nowrap">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                        {item.size && <p><strong>{item.item.sizesTitle || 'Tamanho'}:</strong> {item.size}</p>}
                                                        {item.flavors && item.flavors.length > 0 && <p><strong>{item.item.flavorsTitle || 'Sabores'}:</strong> {item.flavors.join(', ')}</p>}
                                                        {item.border && <p><strong>{item.item.borderTitle || 'Borda'}:</strong> {item.border}</p>}
                                                        {item.extras && item.extras.length > 0 && <p><strong>{item.item.extrasTitle || 'Extras'}:</strong> {item.extras.join(', ')}</p>}
                                                        {item.observation && <p><strong>Obs:</strong> {item.observation}</p>}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => onUpdateQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-7 h-7 rounded bg-gray-200 text-gray-700 disabled:opacity-50 flex-shrink-0">-</button>
                                                            <span className="font-bold text-lg">{item.quantity}</span>
                                                            <button onClick={() => onUpdateQuantity(item._id, item.quantity + 1)} className="w-7 h-7 rounded bg-purple-600 text-white flex-shrink-0">+</button>
                                                        </div>
                                                        <button onClick={() => onRemoveItem(item._id)} className="text-gray-400 hover:text-red-500 p-2"><FaTrash /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {step === 'checkout' && (
                            <motion.div
                                key="checkout"
                                custom={1}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                                className="absolute inset-0 p-4 overflow-y-auto space-y-4"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu Nome *" className="form-input bg-gray-100 text-gray-900" />
                                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Seu Telefone *" className="form-input bg-gray-100 text-gray-900" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setTipoEntrega('entrega')} className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${tipoEntrega === 'entrega' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}><FaMotorcycle /> Entrega</button>
                                    <button onClick={() => setTipoEntrega('retirada')} className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${tipoEntrega === 'retirada' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}><FaShoppingBag /> Retirada</button>
                                </div>
                                {tipoEntrega === 'entrega' && (
                                    <div className="space-y-2">
                                        <select value={customerAddress.neighborhood} onChange={e => setCustomerAddress(p => ({ ...p, neighborhood: e.target.value }))} className="form-input bg-gray-100 text-gray-900">
                                            <option value="">Selecione o Bairro *</option>
                                            {deliveryFees.map(f => <option key={f.neighborhood} value={f.neighborhood}>{f.neighborhood}</option>)}
                                        </select>
                                        <input type="text" value={customerAddress.street} onChange={e => setCustomerAddress(p => ({ ...p, street: e.target.value }))} placeholder="Rua *" className="form-input bg-gray-100 text-gray-900" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" value={customerAddress.number} onChange={e => setCustomerAddress(p => ({ ...p, number: e.target.value }))} placeholder="Número *" className="form-input bg-gray-100 text-gray-900" />
                                            <input type="text" value={customerAddress.complement} onChange={e => setCustomerAddress(p => ({ ...p, complement: e.target.value }))} placeholder="Complemento" className="form-input bg-gray-100 text-gray-900" />
                                        </div>
                                        <input type="text" value={customerAddress.referencePoint} onChange={e => setCustomerAddress(p => ({ ...p, referencePoint: e.target.value }))} placeholder="Ponto de Referência (opcional)" className="form-input bg-gray-100 text-gray-900" />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value as any)} className="form-input bg-gray-100 text-gray-900">
                                        <option value="dinheiro">Dinheiro</option>
                                        <option value="cartao">Cartão</option>
                                        <option value="pix">PIX</option>
                                    </select>
                                    {formaPagamento === 'dinheiro' && <input type="number" value={troco} onChange={e => setTroco(e.target.value)} placeholder="Troco para (opcional)" className="form-input bg-gray-100 text-gray-900" />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {items.length > 0 && (
                    <div className="p-4 border-t border-gray-200 space-y-4 flex-shrink-0">
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                            {step === 'checkout' && tipoEntrega === 'entrega' && <div className="flex justify-between text-gray-500"><span>Taxa de Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>}
                            <div className="flex justify-between font-bold text-xl"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {step === 'review' ? (
                            <button onClick={() => setStep('checkout')} className="w-full p-4 rounded-lg bg-purple-600 hover:bg-purple-700 font-bold text-lg transition-colors text-white">
                                Continuar
                            </button>
                        ) : (
                            <button onClick={handleSaveAndCheckout} disabled={isSaving} className="w-full p-4 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 font-bold text-lg transition-colors text-white">
                                {isSaving ? 'Finalizando...' : 'Finalizar Pedido'}
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
            <WhatsAppModal
                isOpen={showWhatsAppModal}
                onClose={handleCloseWhatsAppModal}
                whatsappLink={whatsappLink}
            />
        </motion.div>
    );
};

export default Cart;