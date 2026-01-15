import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // HARDCODED: Dark mode is always true.
  const isDarkMode = true;

  // No-op function. Does nothing.
  const toggleTheme = () => {
    console.log("Theme toggle is disabled. Dark mode is enforced.");
  };

  useEffect(() => {
    // FORCE the 'dark' class on the HTML element immediately.
    // REMOVE 'light' class if it dares to exist.
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
