"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function ProductControls({ product }: { product: any }) {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  
  const cartItem = items.find(item => item.product._id === product._id.toString());
  const quantityInCart = cartItem?.quantity || 0;

  const isAvailable = product.isActive !== false;
  const isStockOut = product.stock === 0;

  const handleAdd = () => {
    addToCart({
      _id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock
    });
  };

  const increase = () => {
    if (quantityInCart > 0) {
      updateQuantity(product._id.toString(), quantityInCart + 1);
    }
  };
  
  const decrease = () => {
    if (quantityInCart > 1) {
      updateQuantity(product._id.toString(), quantityInCart - 1);
    } else if (quantityInCart === 1) {
      removeFromCart(product._id.toString());
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {quantityInCart > 0 ? (
        <div className="flex items-center border border-slate-300 dark:border-slate-700 w-full sm:w-auto h-14 bg-white dark:bg-slate-900 shadow-sm">
          <button 
            onClick={decrease}
            className="w-14 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Minus size={18} />
          </button>
          <div className="w-16 h-full flex items-center justify-center font-bold text-lg border-x border-slate-300 dark:border-slate-700">
            {quantityInCart}
          </div>
          <button 
            onClick={increase}
            className="w-14 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      ) : (
        <button 
          onClick={handleAdd}
          disabled={!isAvailable || isStockOut}
          className={`flex-1 w-full h-14 flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm transition-all shadow-sm ${
            !isAvailable || isStockOut
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 hover:shadow-xl hover:-translate-y-1'
          }`}
        >
          <ShoppingCart size={20} />
          {!isAvailable ? 'Not Available' : isStockOut ? 'Stock Out' : 'Add to Cart'}
        </button>
      )}
    </div>
  );
}
