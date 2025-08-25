'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../types/cart';
import { FaTrash, FaTimes, FaMotorcycle, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (itemId: string, quantity: number) => void;
    onRemoveItem: (itemId: string) => void;
    onCheckout: (orderId: string) => void;
    onClose: () => void;
}

const Cart = ({ items, onUpdateQuantity, onRemoveItem, onCheckout, onClose }: CartProps) => {
    const { clearCart } = useCart();
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
    const [customerAddress, setCustomerAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', referencePoint: '' });
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);
    const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
    const [troco, setTroco] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

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
        async function fetchDeliveryFees() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success) {
                    setDeliveryFees(data.data.deliveryFees || []);
                }
            } catch (err) {
                console.error("Erro ao buscar taxas de entrega:", err);
            }
        }
        fetchDeliveryFees();
    }, []);

    const deliveryFee = useMemo(() => {
        if (tipoEntrega === 'retirada' || !customerAddress.neighborhood) return 0;
        const fee = deliveryFees.find(f => f.neighborhood === customerAddress.neighborhood);
        return fee ? fee.fee : 0;
    }, [tipoEntrega, customerAddress.neighborhood, deliveryFees]);

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
    const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

    const handleSaveAndCheckout = async () => {
        if (!customerName || !customerPhone) {
            setError('Nome e telefone são obrigatórios.');
            return;
        }
        if (tipoEntrega === 'entrega' && (!customerAddress.street || !customerAddress.number || !customerAddress.neighborhood)) {
            setError('Endereço completo é obrigatório para entrega.');
            return;
        }

        setIsSaving(true);
        setError('');

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
                onCheckout(data.pedidoId);
                clearCart();
            } else {
                setError(data.message || 'Erro ao criar o pedido.');
            }
        } catch (err) {
            setError('Erro de conexão ao finalizar o pedido.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex justify-end"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-lg h-full bg-[#1e1e1e] text-white flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-xl font-bold text-purple-500">Seu Carrinho</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700"><FaTimes /></button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {items.length === 0 ? (
                        <p className="text-center text-gray-400">Seu carrinho está vazio.</p>
                    ) : (
                        items.map(item => (
                            <div key={item._id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-[#2a2a2a]">
                                <img src={item.item.image || '/placeholder.jpg'} alt={item.item.name} className="w-20 h-20 rounded-md object-cover" />
                                <div className="flex-1">
                                    <h3 className="font-semibold">{item.item.name}</h3>
                                    <p className="text-sm text-gray-400">R$ {item.price.toFixed(2)}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button onClick={() => onUpdateQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-6 h-6 rounded bg-gray-700 disabled:opacity-50">-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item._id, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-700">+</button>
                                    </div>
                                </div>
                                <button onClick={() => onRemoveItem(item._id)} className="text-gray-500 hover:text-red-500"><FaTrash /></button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-700 space-y-4">
                    {/* Dados do Cliente */}
                    <div>
                        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu Nome *" className="form-input" />
                        <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Seu Telefone *" className="form-input mt-2" />
                    </div>

                    {/* Tipo de Entrega */}
                    <div className="flex gap-2">
                        <button onClick={() => setTipoEntrega('entrega')} className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${tipoEntrega === 'entrega' ? 'bg-purple-600' : 'bg-gray-700'}`}><FaMotorcycle /> Entrega</button>
                        <button onClick={() => setTipoEntrega('retirada')} className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${tipoEntrega === 'retirada' ? 'bg-purple-600' : 'bg-gray-700'}`}><FaShoppingBag /> Retirada</button>
                    </div>

                    {/* Endereço */}
                    {tipoEntrega === 'entrega' && (
                        <div className="space-y-2">
                            <input type="text" value={customerAddress.street} onChange={e => setCustomerAddress(p => ({ ...p, street: e.target.value }))} placeholder="Rua *" className="form-input" />
                            <input type="text" value={customerAddress.number} onChange={e => setCustomerAddress(p => ({ ...p, number: e.target.value }))} placeholder="Número *" className="form-input" />
                            <select value={customerAddress.neighborhood} onChange={e => setCustomerAddress(p => ({ ...p, neighborhood: e.target.value }))} className="form-input">
                                <option value="">Selecione o Bairro *</option>
                                {deliveryFees.map(f => <option key={f.neighborhood} value={f.neighborhood}>{f.neighborhood}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Pagamento */}
                    <div className="space-y-2">
                        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value as any)} className="form-input">
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao">Cartão</option>
                            <option value="pix">PIX</option>
                        </select>
                        {formaPagamento === 'dinheiro' && <input type="number" value={troco} onChange={e => setTroco(e.target.value)} placeholder="Troco para (opcional)" className="form-input" />}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-700 pt-4 space-y-2">
                        <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-400"><span>Taxa de Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-xl"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button onClick={handleSaveAndCheckout} disabled={isSaving || items.length === 0} className="w-full p-4 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 font-bold text-lg">
                        {isSaving ? 'Finalizando...' : 'Finalizar Pedido'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Cart;