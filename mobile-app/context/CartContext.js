import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Array of items: { productId, name, brand, price, originalPrice, onSale, image, stock, qty }
  const [cart, setCart] = useState([]);

  // Add an item to the cart, or increase its quantity if already present
  function addToCart(product, quantity = 1) {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.productId === product.id || item.productId === product.productId
      );

      const maxStock = typeof product.stock === "number" ? product.stock : 999;

      if (existingIndex > -1) {
        const nextCart = [...prevCart];
        const currentItem = nextCart[existingIndex];
        const newQty = Math.min(currentItem.qty + quantity, maxStock);
        nextCart[existingIndex] = { ...currentItem, qty: newQty };
        return nextCart;
      }

      const newItem = {
        productId: product.id || product.productId,
        name: product.name,
        brand: product.brand,
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        onSale: Boolean(product.onSale),
        image: product.image,
        stock: maxStock,
        qty: Math.min(Math.max(1, quantity), maxStock),
      };

      return [...prevCart, newItem];
    });
  }

  // Update specific product's quantity
  function updateQty(productId, quantity) {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.productId !== productId);
      }
      return prevCart.map((item) => {
        if (item.productId === productId) {
          const maxStock = typeof item.stock === "number" ? item.stock : 999;
          return { ...item, qty: Math.min(quantity, maxStock) };
        }
        return item;
      });
    });
  }

  // Remove a product from the cart completely
  function removeFromCart(productId) {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }

  // Empty the cart
  function clearCart() {
    setCart([]);
  }

  // Subtotal calculated from all line items
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal; // Free shipping
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        subtotal,
        total,
        cartCount,
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

