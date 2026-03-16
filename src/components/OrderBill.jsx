import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const OrderBill = ({ cart, orderId, subtotal }) => {
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div 
      className="order-bill"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bill-header">
        <div className="bill-shop-info">
          <Sparkles size={20} className="bill-logo-icon" />
          <h1>PETTIKADAI</h1>
          <p>Traditional Savory Shop</p>
        </div>
        <div className="bill-title-badge">BILL OF SUPPLY</div>
      </div>

      <div className="bill-meta">
        <div className="bill-meta-row">
          <span>Order ID:</span>
          <span>#{orderId}</span>
        </div>
        <div className="bill-meta-row">
          <span>Date:</span>
          <span>{date}</span>
        </div>
      </div>

      <div className="bill-divider"></div>

      <div className="bill-items">
        <div className="bill-item-header">
          <span className="col-name">ITEM</span>
          <span className="col-qty">QTY</span>
          <span className="col-total">TOTAL</span>
        </div>
        {cart.map((c, idx) => (
          <div key={idx} className="bill-item-row">
            <span className="col-name">{c.item.name}</span>
            <span className="col-qty">{c.qty}</span>
            <span className="col-total">₹{c.item.price * c.qty}</span>
          </div>
        ))}
      </div>

      <div className="bill-divider dotted"></div>

      <div className="bill-footer">
        <div className="bill-total-row">
          <span>SUBTOTAL</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="bill-total-row final">
          <span>GRAND TOTAL</span>
          <span>₹{subtotal}</span>
        </div>
      </div>

      <div className="bill-thanks">
        <p>Thank you for shopping with us!</p>
        <p className="tamil-text">மீண்டும் வருக (Come Again)</p>
      </div>
    </motion.div>
  );
};

export default OrderBill;
