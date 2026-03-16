import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import menuData from '../data/menuData.json';

const CartPanel = ({ cart, onUpdateQty, onRemove, onClose, onPlaceOrder, onAddToCart }) => {
  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);

  // Find a pairing for items currently in cart
  const allPairings = cart
    .filter(c => c.item.suggestedPairing)
    .map(c => c.item.suggestedPairing);
  
  let recommendedItem = null;
  if (allPairings.length > 0) {
    const allMenuProps = menuData.categories.flatMap(cat => cat.items);
    // Find first suggested pairing that is NOT already in cart
    recommendedItem = allPairings
      .map(pName => allMenuProps.find(i => i.name === pName))
      .find(product => product && !cart.some(c => c.item.name === product.name));
  }

  return (
    <motion.div
      className="cart-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="cart-panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-panel-header">
          <h3>Your Cart</h3>
          <button className="cart-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={40} strokeWidth={1.5} />
              <p>Your cart is empty</p>
              <span>Browse the menu to add items!</span>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map((entry) => (
                <motion.div
                  key={entry.item.name}
                  className="cart-item-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  layout
                >
                  <div className="cart-item-info">
                    <span className="cart-item-name">{entry.item.name}</span>
                    <span className="cart-item-unit">₹{entry.item.price} / {entry.item.unit}</span>
                  </div>
                  <div className="cart-qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => entry.qty <= 1 ? onRemove(entry.item.name) : onUpdateQty(entry.item.name, entry.qty - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-value">{entry.qty}</span>
                    <button className="qty-btn" onClick={() => onUpdateQty(entry.item.name, entry.qty + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="cart-item-total">₹{entry.item.price * entry.qty}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {recommendedItem && (
          <div className="cart-upsell-box">
            <div className="cart-upsell-header">
              <Sparkles size={14} color="var(--primary-color)" />
              <span>Perfect Pairing</span>
            </div>
            <div className="cart-upsell-content">
              <div>
                <span className="cu-name">{recommendedItem.name}</span>
                <span className="cu-price">₹{recommendedItem.price}</span>
              </div>
              <button className="cu-add-btn" onClick={() => onAddToCart(recommendedItem)}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        )}

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span className="cart-subtotal-value">₹{subtotal}</span>
            </div>
            <button className="place-order-btn" onClick={onPlaceOrder}>
              Place Order
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CartPanel;
