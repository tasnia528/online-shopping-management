"use client";

import { useEffect, useState, FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Truck, Lock, CreditCard, Banknote, CheckCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import confetti from "canvas-confetti";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

function StripePaymentForm({ clientSecret, onSuccess, amount }: { clientSecret: string, onSuccess: (paymentIntentId: string) => void, amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We handle redirect manually or don't redirect for API call
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || "An error occurred during payment.");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError("Payment failed or requires additional action.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      {error && <div className="text-red-500 mt-4 text-sm font-medium">{error}</div>}
      <button
        disabled={!stripe || processing}
        className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {processing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, totalPrice, isLoaded, updateQuantity, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe'>('cod');
  
  // Stripe state
  const [clientSecret, setClientSecret] = useState("");
  
  // New Address Form State
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  });

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const finalAmount = totalPrice;

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
          if (data.addresses && data.addresses.length > 0) {
            setAddresses(data.addresses);
            const primaryIndex = data.addresses.findIndex((a: any) => a.isPrimary);
            setSelectedAddressIndex(primaryIndex >= 0 ? primaryIndex : 0);
          } else {
            setIsNewAddress(true);
          }
        })
        .finally(() => setLoadingAddress(false));
    }
  }, [status]);

  useEffect(() => {
    // Fetch PaymentIntent client secret if Stripe is selected
    if (paymentMethod === 'stripe' && finalAmount > 0) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          }
        });
    }
  }, [paymentMethod, finalAmount]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getActiveAddress = () => {
    if (isNewAddress) return formData;
    return addresses[selectedAddressIndex];
  };
  
  const canProceed = isNewAddress 
    ? (formData.street && formData.city && formData.state && formData.zipCode && formData.country) 
    : (addresses.length > 0 && selectedAddressIndex >= 0);

  const placeOrder = async (paymentIntentId?: string) => {
    setPlacingOrder(true);
    setOrderError(null);
    
    let activeAddress = getActiveAddress();

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

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ product: i.product._id, quantity: i.quantity })),
          shippingAddress: activeAddress,
          paymentMethod,
          paymentIntentId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      clearCart();
      setShowSuccess(true);
      
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4F46E5', '#10B981', '#F59E0B']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4F46E5', '#10B981', '#F59E0B']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();

      setTimeout(() => {
        router.push("/dashboard/orders");
      }, 3500);
      
    } catch (err: any) {
      setOrderError(err.message);
      setPlacingOrder(false);
    }
  };

  const handleCODSubmit = () => {
    placeOrder();
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm animate-[fade-in-up_0.5s_ease-out]">
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 scale-110">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Thank You!</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-2 font-medium">Your order has been placed successfully.</p>
          <p className="text-slate-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

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
            
            {!isNewAddress && addresses.length === 0 ? (
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
                  <input required name="street" value={formData.street} onChange={handleInputChange} placeholder="Street Address" className="col-span-full w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                  <input required name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                  <input required name="state" value={formData.state} onChange={handleInputChange} placeholder="State / Province" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                  <input required name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="Zip / Postal Code" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                  <input required name="country" value={formData.country} onChange={handleInputChange} placeholder="Country" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                  <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number (Optional)" className="col-span-full w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                </div>
                {addresses.length > 0 && (
                  <button onClick={() => setIsNewAddress(false)} className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-500">
                    Cancel & use saved address
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white">Select Shipping Address</h3>
                  <button onClick={() => setIsNewAddress(true)} className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
                    + Add New Address
                  </button>
                </div>
                <div className="space-y-3">
                  {addresses.map((addr, idx) => (
                    <label key={idx} className={`block p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressIndex === idx ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300'}`}>
                      <div className="flex items-start gap-3">
                        <input type="radio" name="address" checked={selectedAddressIndex === idx} onChange={() => setSelectedAddressIndex(idx)} className="mt-1 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{session?.user?.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{addr.street}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{addr.city}, {addr.state} {addr.zipCode}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{addr.country}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-600" /> Payment Method
            </h2>

            <div className="space-y-4">
              {/* Payment Selection Options */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
                >
                  <Banknote size={24} />
                  <span className="font-bold">Cash on Delivery</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${paymentMethod === 'stripe' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
                >
                  <CreditCard size={24} />
                  <span className="font-bold">Credit Card</span>
                </button>
              </div>

              {/* Payment Interface */}
              <div className="mt-6">
                {!canProceed ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-lg text-sm text-center">
                    Please provide a shipping address first.
                  </div>
                ) : (
                  <>
                    {paymentMethod === 'cod' && (
                      <div className="text-center">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg mb-6">
                          <p className="font-medium text-slate-900 dark:text-white mb-2">Pay when you receive</p>
                          <p className="text-sm text-slate-500">You will pay ${finalAmount.toFixed(2)} in cash to the delivery agent.</p>
                        </div>
                        <button 
                          onClick={handleCODSubmit}
                          disabled={placingOrder}
                          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm rounded-lg hover:shadow-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {placingOrder ? "Processing..." : (
                            <>
                              <Lock size={16} />
                              Place Order (COD)
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'stripe' && (
                      <div>
                        {clientSecret ? (
                          <Elements options={{ clientSecret }} stripe={stripePromise}>
                            <StripePaymentForm 
                              clientSecret={clientSecret} 
                              amount={finalAmount}
                              onSuccess={placeOrder}
                            />
                          </Elements>
                        ) : (
                          <div className="text-center py-4">Loading secure payment portal...</div>
                        )}
                      </div>
                    )}

                    {orderError && (
                      <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-center font-medium border border-red-200">
                        {orderError}
                      </div>
                    )}
                  </>
                )}
              </div>
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
              
              <div className="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <span className="font-bold text-lg text-slate-900 dark:text-white">Total</span>
                <span className="font-black text-2xl text-indigo-600 dark:text-indigo-400">${finalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <p className="text-xs text-center text-slate-400">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
