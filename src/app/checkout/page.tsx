"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Truck, Lock } from "lucide-react";

export default function CheckoutPage() {
  const { items, totalPrice, isLoaded, updateQuantity, removeFromCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [address, setAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isNewAddress, setIsNewAddress] = useState(false);
  
  // New Address Form State
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          const primary = data.addresses?.find((a: any) => a.isPrimary) || data.addresses?.[0];
          setAddress(primary);
        })
        .finally(() => setLoadingAddress(false));
    }
  }, [status]);

  if (status === "loading" || !isLoaded || loadingAddress) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
        <Link href="/products" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    
    // Save new address if applicable
    if (isNewAddress) {
      try {
        const res = await fetch("/api/profile");
        const profile = await res.json();
        
        const updatedAddresses = [...(profile.addresses || []), { ...formData, isPrimary: true }];
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: updatedAddresses })
        });
      } catch (err) {
        console.error("Failed to save address", err);
      }
    }

    // Simulate order placement
    setTimeout(() => {
      setPlacingOrder(false);
      alert("Order placed successfully! (This is a demo)");
      localStorage.removeItem("shopping_cart");
      window.location.href = "/";
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const canPlaceOrder = address || (formData.street && formData.city && formData.zipCode && formData.country);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-[fade-in-up_0.8s_ease-out_forwards]">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-slate-500">Review your order and complete your purchase.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Side: Shipping & Payment Info */}
        <div className="w-full lg:w-2/3 space-y-8">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <Truck size={20} className="text-indigo-600" /> Shipping Address
            </h2>
            
            {!address && !isNewAddress ? (
              <div className="text-center py-6">
                <p className="text-slate-500 mb-4">You don't have a shipping address saved.</p>
                <button onClick={() => setIsNewAddress(true)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition-colors">
                  Add Shipping Address
                </button>
              </div>
            ) : isNewAddress ? (
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Enter New Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required name="street" value={formData.street} onChange={handleInputChange} placeholder="Street Address" className="col-span-full w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input required name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input required name="state" value={formData.state} onChange={handleInputChange} placeholder="State / Province" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input required name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="Zip / Postal Code" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input required name="country" value={formData.country} onChange={handleInputChange} placeholder="Country" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number (Optional)" className="col-span-full w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <p className="text-xs text-slate-500 mt-4">This address will be automatically saved to your profile for future use.</p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-2 text-lg">{session?.user?.name}</p>
                <p className="text-slate-600 dark:text-slate-300">{address.street}</p>
                <p className="text-slate-600 dark:text-slate-300">{address.city}, {address.state} {address.zipCode}</p>
                <p className="text-slate-600 dark:text-slate-300">{address.country}</p>
                
                <button onClick={() => { setAddress(null); setIsNewAddress(true); }} className="inline-block mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-500">
                  Use Different Address
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-600" /> Payment Method
            </h2>
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-center">
              <p className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">Demo Environment</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">Payment processing is bypassed in this demo. Click "Place Order" to proceed.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Order Summary</h2>
            
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.product._id} className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.product.name}</p>
                    <div className="flex items-center gap-3 mt-1 mb-1">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900">
                        <button 
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >-</button>
                        <span className="text-xs font-bold px-2 border-x border-slate-200 dark:border-slate-700">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >+</button>
                      </div>
                      <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-3 mb-6">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax</span>
                <span>${(totalPrice * 0.08).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <span className="font-bold text-lg text-slate-900 dark:text-white">Total</span>
                <span className="font-black text-2xl text-indigo-600 dark:text-indigo-400">${(totalPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={placingOrder || !canPlaceOrder}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm rounded-lg hover:shadow-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {placingOrder ? "Processing..." : (
                <>
                  <Lock size={16} />
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
