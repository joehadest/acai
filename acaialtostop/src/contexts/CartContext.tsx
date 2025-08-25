// src/contexts/CartContext.tsx

'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '../types/menu';
import { CartItem, CartContextType } from '../types/cart';
import { calculateItemPrice } from '../utils/priceCalculator'; // Importa a função centralizada
import { menuItems } from '../data/menu';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = (item: MenuItem, quantity: number, observation?: string, size?: string, border?: string, extras?: string[]) => {
        // Usa a função centralizada para obter o preço unitário correto.
        const allPizzas = menuItems.filter(i => i.category === 'pizzas');
        const finalPrice = calculateItemPrice(item, size, border, extras, observation, allPizzas);

        // Verifica se um item idêntico (com as mesmas opções) já existe no carrinho.
        const existingItemIndex = items.findIndex(
            cartItem => cartItem.item._id === item._id &&
                cartItem.size === size &&
                cartItem.border === border &&
                JSON.stringify(cartItem.extras?.sort()) === JSON.stringify(extras?.sort()) &&
                cartItem.observation === observation
        );

        if (existingItemIndex > -1) {
            // Se já existe, apenas aumenta a quantidade.
            const updatedItems = [...items];
            updatedItems[existingItemIndex].quantity += quantity;
            setItems(updatedItems);
        } else {
            // Se não existe, adiciona como um novo item com o preço já calculado.
            const newItem: CartItem = {
                _id: `${item._id}-${Date.now()}`, // ID único para o item no carrinho
                item,
                quantity,
                observation,
                size,
                border,
                extras,
                name: item.name,
                price: finalPrice // Armazena o preço final correto.
            };
            setItems([...items, newItem]);
        }
    };

    const removeFromCart = (itemId: string) => {
        setItems(prevItems => prevItems.filter(item => item._id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item._id === itemId && quantity > 0
                    ? { ...item, quantity }
                    : item
            ).filter(item => item.quantity > 0)
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}