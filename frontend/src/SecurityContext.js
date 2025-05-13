import React, { createContext, useState, useContext } from 'react';

const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
  const [armedHomes, setArmedHomes] = useState(Array(20).fill(true)); // All homes armed by default

  const toggleArmStatus = (index) => {
    setArmedHomes((prev) => {
      const newHomes = [...prev];
      newHomes[index] = !newHomes[index];
      return newHomes;
    });
  };

  return (
    <SecurityContext.Provider value={{ armedHomes, toggleArmStatus }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => useContext(SecurityContext);
