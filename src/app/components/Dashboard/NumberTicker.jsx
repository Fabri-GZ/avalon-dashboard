"use client";

import { useState, useEffect } from "react";

const NumberTicker = ({ value, className = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(numValue)) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1000;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        const suffix = typeof value === 'string' ? value.replace(/[0-9.-]/g, '') : '';
        setDisplayValue(Math.floor(current) + suffix);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className={className}>{displayValue}</span>;
};

export default NumberTicker;