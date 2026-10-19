"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

export interface CartItem {
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  level: string;
  instructorName: string;
  price: number;
  discountPrice?: number;
  effectivePrice: number;
  isFree: boolean;
  isAlreadyEnrolled: boolean;
}

export interface CouponDetails {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  basketCount: number;
  basketItems: CartItem[];
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  coupon: CouponDetails | null;
  loading: boolean;
  addToCart: (courseId: string) => Promise<boolean>;
  addToBasket: (courseId: string) => Promise<boolean>;
  removeFromCart: (courseId: string) => Promise<void>;
  removeFromBasket: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearBasket: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  isInCart: (courseId: string) => boolean;
  isInBasket: (courseId: string) => boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSubtotal(0);
      setDiscountAmount(0);
      setFinalTotal(0);
      setCoupon(null);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setSubtotal(data.subtotal || 0);
        setDiscountAmount(data.discountAmount || 0);
        setFinalTotal(data.finalTotal || 0);
        setCoupon(data.coupon || null);
      }
    } catch (err) {
      console.error("Cart refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (courseId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in to add courses to your cart");
      return false;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Course added to your cart!");
        await refreshCart();
        return true;
      } else {
        toast.error(data.error || "Could not add course to cart");
        return false;
      }
    } catch {
      toast.error("Network error while adding to cart");
      return false;
    }
  };

  const removeFromCart = async (courseId: string) => {
    try {
      const res = await fetch(`/api/cart?courseId=${courseId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Course removed from cart");
        await refreshCart();
      }
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      await fetch("/api/cart?clear=true", { method: "DELETE" });
      await refreshCart();
    } catch {
      console.error("Failed to clear cart");
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/cart/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Coupon applied!");
        await refreshCart();
        return true;
      } else {
        toast.error(data.error || "Invalid coupon code");
        return false;
      }
    } catch {
      toast.error("Failed to apply coupon");
      return false;
    }
  };

  const removeCoupon = async () => {
    try {
      await fetch("/api/cart/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: true }),
      });
      toast.success("Coupon removed");
      await refreshCart();
    } catch {
      console.error("Failed to remove coupon");
    }
  };

  const isInCart = (courseId: string) => {
    return items.some((i) => i.courseId.toString() === courseId.toString());
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount: items.length,
        basketCount: items.length,
        basketItems: items,
        subtotal,
        discountAmount,
        finalTotal,
        coupon,
        loading,
        addToCart,
        addToBasket: addToCart,
        removeFromCart,
        removeFromBasket: removeFromCart,
        clearCart,
        clearBasket: clearCart,
        applyCoupon,
        removeCoupon,
        isInCart,
        isInBasket: isInCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export const useCourseBasket = useCart;
