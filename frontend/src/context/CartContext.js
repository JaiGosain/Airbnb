import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cartAPI } from '../utils/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

const initialState = {
  cart: null,
  loading: true,
  error: null
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_CART':
      return { ...state, cart: { ...state.cart, items: [], totalItems: 0, totalAmount: 0 } };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const fetchCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartAPI.getCart();
      dispatch({ type: 'SET_CART', payload: response.data.cart });
    } catch (error) {
      console.error('Error fetching cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  const addToCart = async (itemData) => {
    try {
      const response = await cartAPI.addToCart(itemData);
      dispatch({ type: 'SET_CART', payload: response.data.cart });
      toast.success('Added to cart successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateCartItem = async (itemId, updateData) => {
    try {
      const response = await cartAPI.updateCartItem(itemId, updateData);
      dispatch({ type: 'SET_CART', payload: response.data.cart });
      toast.success('Cart updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update cart';
      toast.error(message);
      return { success: false, message };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await cartAPI.removeFromCart(itemId);
      dispatch({ type: 'SET_CART', payload: response.data.cart });
      toast.success('Item removed from cart!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from cart';
      toast.error(message);
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      toast.error(message);
      return { success: false, message };
    }
  };

  const getCartItemCount = () => {
    return state.cart?.totalItems || 0;
  };

  const getCartTotal = () => {
    return state.cart?.totalAmount || 0;
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const value = {
    ...state,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};



