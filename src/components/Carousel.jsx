import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const Carousel = ({ items, onAddToCart, onUpdateQty, onRemove, onItemClick, cart = [] }) => {
  const getQty = (name) => {
    const entry = cart.find(c => c.item.name === name);
    return entry ? entry.qty : 0;
  };

  return (
    <div className="carousel-container">
      {items.map((item, index) => {
        const qty = getQty(item.name);
        return (
          <motion.div
            key={index}
            className="carousel-item"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
            onClick={() => onItemClick && onItemClick(item)}
          >
            <div className="item-image">
              <img 
                src={item.image || '/images/kaaram.png'} 
                alt={item.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="item-info">
              <div className="item-type">{item.category || 'SNACK'}</div>
              <div className="item-name">{item.name}</div>
              <div className="item-price-row">
                <span className="item-price">₹{item.price}</span>
                <span className="item-unit">/ {item.unit}</span>
              </div>
              <div className="item-desc">{item.description}</div>

              {qty > 0 ? (
                <div className="card-qty-controls">
                  <button
                    className="qty-btn"
                    onClick={(e) => { e.stopPropagation(); qty <= 1 ? onRemove(item.name) : onUpdateQty(item.name, qty - 1); }}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{qty}</span>
                  <button
                    className="qty-btn"
                    onClick={(e) => { e.stopPropagation(); onUpdateQty(item.name, qty + 1); }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className="add-to-cart-btn"
                  onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                >
                  <Plus size={14} /> Add to Cart
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Carousel;
