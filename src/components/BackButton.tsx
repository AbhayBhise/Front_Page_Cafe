import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ fallbackPath = '/menu', className = 'mb-4' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // If there's history, go back. Otherwise go to fallback.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <motion.button
      whileHover={{ x: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleBack}
      className={`btn btn-outline-secondary d-inline-flex align-items-center gap-2 ${className}`}
      aria-label="Go back"
    >
      <i className="bi bi-arrow-left"></i>
      <span>Back</span>
    </motion.button>
  );
};

export default BackButton;
