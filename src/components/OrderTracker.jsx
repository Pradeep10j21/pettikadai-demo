import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, ChefHat, Truck, PackageCheck } from 'lucide-react';

const steps = [
  { label: 'Placed', icon: ClipboardList },
  { label: 'Preparing', icon: ChefHat },
  { label: 'Shipped', icon: Truck },
  { label: 'Delivered', icon: PackageCheck },
];

const OrderTracker = ({ orderId, currentStep = 1 }) => {
  return (
    <div className="order-tracker">
      <div className="tracker-header">
        <span className="tracker-order-id">Order #{orderId}</span>
        <span className="tracker-status">{steps[currentStep].label}</span>
      </div>
      <div className="tracker-steps">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;
          const isPending = idx > currentStep;
          return (
            <React.Fragment key={step.label}>
              <motion.div
                className={`tracker-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200 }}
              >
                <div className="step-circle">
                  <Icon size={16} />
                </div>
                <span className="step-label">{step.label}</span>
              </motion.div>
              {idx < steps.length - 1 && (
                <div className={`step-connector ${idx < currentStep ? 'filled' : ''}`}>
                  {idx < currentStep && (
                    <motion.div
                      className="connector-fill"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: idx * 0.15 + 0.1, duration: 0.4 }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;
