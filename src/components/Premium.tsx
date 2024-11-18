// src/components/Premium.tsx
import { useState } from 'react';
import { Button, Modal, Card } from '@telegram-apps/telegram-ui';
import styles from './Premium.module.css';

export const Premium = () => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePremiumPurchase = async () => {
    // Simulate AEON payment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store premium status
    localStorage.setItem('premium', 'true');
    
    // Show success message
    setShowSuccess(true);
    
    // Hide after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      <Button onClick={handlePremiumPurchase}>
        Become Premium Member
      </Button>

      {showSuccess && (
        <div className={styles.successToast}>
          🎉 Congratulations! You are now a premium member!
        </div>
      )}
    </>
  );
};