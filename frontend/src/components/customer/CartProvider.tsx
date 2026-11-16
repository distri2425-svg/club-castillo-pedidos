import React, { createContext, useContext, useEffect, useState } from "react";

// 👇 Se incluye el campo `type` para distinguir entre comida y bebida
export interface CartItem {
    id: number;
    name: string;
    restaurantId: number;
    price: number;
    imageBase64?: string;
    quantity: number;
    description?: string;
    type: "food" | "beverage"; // 👈 CLAVE
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: number, type: "food" | "beverage") => void;
    updateQuantity: (id: number, type: "food" | "beverage", qty: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
    return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        const fromStorage = localStorage.getItem("customer_cart");
        return fromStorage ? JSON.parse(fromStorage) : [];
    });

    useEffect(() => {
        localStorage.setItem("customer_cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: CartItem) => {
        setCart(prev =>
            prev.some(ci => ci.id === item.id && ci.type === item.type)
                ? prev.map(ci =>
                    ci.id === item.id && ci.type === item.type
                        ? { ...ci, quantity: ci.quantity + 1 }
                        : ci
                )
                : [...prev, { ...item, quantity: 1 }]
        );
    };

    const removeFromCart = (id: number, type: "food" | "beverage") =>
        setCart(prev => prev.filter(ci => !(ci.id === id && ci.type === type)));

    const updateQuantity = (id: number, type: "food" | "beverage", qty: number) =>
        setCart(prev =>
            prev.map(ci =>
                ci.id === id && ci.type === type
                    ? { ...ci, quantity: qty }
                    : ci
            )
        );

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
