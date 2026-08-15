"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  uniqueItemCount: number;
  totalPrice: number;
  isLoaded: boolean;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("shopping_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from local storage");
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("shopping_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (product: any, quantity = 1) => {
    let success = true;
    setItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.product._id === product._id);
      
      if (existingItemIndex > -1) {
        const newQuantity = prev[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          alert(`Sorry, only ${product.stock} items available in stock.`);
          success = false;
          return prev;
        }
        
        const newItems = [...prev];
        newItems[existingItemIndex].quantity = newQuantity;
        return newItems;
      } else {
        if (quantity > product.stock) {
          alert(`Sorry, only ${product.stock} items available in stock.`);
          success = false;
          return prev;
        }
        return [...prev, { product, quantity }];
      }
    });
    
    if (success) setIsOpen(true);
    return success;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    let success = true;
    setItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.product._id === productId);
      if (existingItemIndex === -1) return prev;
      
      const item = prev[existingItemIndex];
      
      if (quantity > item.product.stock) {
        alert(`Sorry, only ${item.product.stock} items available in stock.`);
        success = false;
        return prev;
      }
      
      if (quantity <= 0) {
        return prev.filter(i => i.product._id !== productId);
      }
      
      const newItems = [...prev];
      newItems[existingItemIndex].quantity = quantity;
      return newItems;
    });
    return success;
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product._id !== productId));
  };

  const clearCart = () => setItems([]);

  const uniqueItemCount = items.length;
  const totalPrice = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, isOpen, setIsOpen, uniqueItemCount, totalPrice, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
