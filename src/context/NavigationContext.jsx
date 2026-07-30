import React, { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('পেজ লোড হচ্ছে...');

  const navigateWithLoading = (to, options = {}, text = 'পেজ লোড হচ্ছে...') => {
    // If navigating to current page, do nothing
    if (typeof to === 'string' && to === location.pathname) return;

    setLoadingText(text);
    setIsNavigating(true);

    setTimeout(() => {
      if (typeof to === 'number') {
        navigate(to);
      } else {
        navigate(to, options);
      }
      setIsNavigating(false);
    }, 300);
  };

  return (
    <NavigationContext.Provider value={{ navigateWithLoading, isNavigating }}>
      {isNavigating && <LoadingSpinner text={loadingText} fullScreen={true} />}
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigateWithLoading = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    // Fallback if used outside provider
    const fallbackNavigate = useNavigate();
    return (to, options) => {
      if (typeof to === 'number') fallbackNavigate(to);
      else fallbackNavigate(to, options);
    };
  }
  return context.navigateWithLoading;
};
