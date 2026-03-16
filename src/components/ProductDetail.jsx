import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Leaf, ShieldCheck, Plus, Minus, ShoppingCart, Flame } from 'lucide-react';

const ProductDetail = ({ item, onClose, onAddToCart, onUpdateQty, onRemove, cartQty = 0 }) => {
  const image = item.name.toLowerCase().includes('murukku') ? '/images/butter_murukku.png' :
                item.name.toLowerCase().includes('mixture') ? '/images/mixture.png' :
                item.name.toLowerCase().includes('sweet') || item.name.toLowerCase().includes('ladoo') ? '/images/sweet.png' : '/images/kaaram.png';

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <motion.div
        className="product-detail-panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button className="pd-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Image */}
        <div className="pd-image">
          <img src={item.image || image} alt={item.name} />
        </div>

        {/* Content */}
        <div className="pd-content">
          <div className="pd-header">
            <span className="pd-category">{item.category}</span>
            <div className="pd-badges-right">
              {item.isVeg && <span className="pd-veg-badge"><Leaf size={12} /> Pure Veg</span>}
            </div>
          </div>

          <div className="pd-title-row">
            <h3 className="pd-name">{item.name}</h3>
            {item.spiceLevel !== undefined && (
              <div className="pd-spice-meter" title={`Spice Level: ${item.spiceLevel}/5`}>
                {[1, 2, 3, 4, 5].map((level) => {
                  const isFilled = level <= item.spiceLevel;
                  const isHot = item.spiceLevel >= 4;
                  return (
                    <motion.div
                      key={level}
                      animate={isHot && isFilled ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                      transition={isHot && isFilled ? { duration: 1.5, repeat: Infinity, delay: level * 0.1 } : {}}
                      className={`spice-icon ${isFilled ? 'filled' : ''} ${isHot && isFilled ? 'hot' : ''}`}
                    >
                      <Flame size={16} fill={isFilled ? 'currentColor' : 'none'} />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pd-price-row">
            <span className="pd-price">₹{item.price}</span>
            <span className="pd-unit">/ {item.unit}</span>
          </div>

          <p className="pd-description">{item.description}</p>

          {/* Info Cards */}
          <div className="pd-info-grid">
            <div className="pd-info-card">
              <Clock size={16} />
              <div>
                <span className="pd-info-label">Shelf Life</span>
                <span className="pd-info-value">{item.shelfLife || 'N/A'}</span>
              </div>
            </div>
            <div className="pd-info-card">
              <ShieldCheck size={16} />
              <div>
                <span className="pd-info-label">Storage</span>
                <span className="pd-info-value">{item.storage || 'Room temperature'}</span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          {item.ingredients && (
            <div className="pd-ingredients">
              <h4>Ingredients</h4>
              <div className="pd-ingredient-tags">
                {item.ingredients.split(', ').map((ing, idx) => (
                  <span key={idx} className="pd-tag">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart / Qty */}
          <div className="pd-actions">
            {cartQty > 0 ? (
              <div className="pd-qty-row">
                <button className="qty-btn" onClick={() => cartQty <= 1 ? onRemove(item.name) : onUpdateQty(item.name, cartQty - 1)}>
                  <Minus size={16} />
                </button>
                <span className="pd-qty-value">{cartQty}</span>
                <button className="qty-btn" onClick={() => onUpdateQty(item.name, cartQty + 1)}>
                  <Plus size={16} />
                </button>
                <span className="pd-qty-total">₹{item.price * cartQty}</span>
              </div>
            ) : (
              <button className="pd-add-btn" onClick={() => onAddToCart(item)}>
                <ShoppingCart size={16} /> Add to Cart — ₹{item.price}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDetail;
