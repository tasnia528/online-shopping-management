"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface WishlistContextType {
  wishlistItems: any[];
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      fetchWishlist();
    } else if (status === "unauthenticated") {
      setWishlistItems([]);
      setIsLoading(false);
    }
  }, [status]);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.wishlist || []);
      }
    } catch (error) {
      console.error("Error fetching wishlist", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (status !== "authenticated") {
      alert("Please sign in to add items to your wishlist.");
      return false;
    }

    try {
      // Optimistic update
      const tempItem = { _id: productId };
      setWishlistItems(prev => [...prev, tempItem]);

      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.wishlist);
        return true;
      } else {
        // Revert on failure
        setWishlistItems(prev => prev.filter(item => item._id !== productId));
        return false;
      }
    } catch (error) {
      console.error("Error adding to wishlist", error);
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
      return false;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (status !== "authenticated") return false;

    try {
      // Optimistic update
      const previousItems = [...wishlistItems];
      setWishlistItems(prev => prev.filter(item => item._id !== productId));

      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.wishlist);
        return true;
      } else {
        // Revert on failure
        setWishlistItems(previousItems);
        return false;
      }
    } catch (error) {
      console.error("Error removing from wishlist", error);
      return false;
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
