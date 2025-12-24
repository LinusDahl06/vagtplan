import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const lightTheme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  surface2: '#ffffff',
  card: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e0e0e0',
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  error: '#f44336',
  divider: '#e0e0e0',
  inputBackground: '#f5f5f5',
  modalOverlay: 'rgba(0,0,0,0.5)',
  shadow: '#000000',
  inactive: '#999999',
  gold: '#FFD700',
  surfaceVariant: '#f9f9f9',
};

export const darkTheme = {
  background: '#121212',
  surface: '#1e1e1e',
  surface2: '#1a2e1a',
  card: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#888888',
  border: '#333333',
  primary: '#4CAF50',
  primaryDark: '#1a2e1a',
  error: '#f44336',
  divider: '#333333',
  inputBackground: '#121212',
  modalOverlay: 'rgba(0,0,0,0.9)',
  shadow: '#000000',
  inactive: '#888888',
  gold: '#FFD700',
  surfaceVariant: '#252525',
}; 

/* Vintage theme:
export const darkTheme = {
  background: '#FDF6E3',
  surface: '#F5E6D3',
  surface2: '#E8D4BC',
  card: '#FAF0E6',
  text: '#3D2E1F',
  textSecondary: '#7A6548',
  border: '#D4C4A8',
  primary: '#D4854A',
  primaryDark: '#6B3D20',
  error: '#B34540',
  divider: '#D4C4A8',
  inputBackground: '#FFF8F0',
  modalOverlay: 'rgba(61, 46, 31, 0.85)',
  shadow: '#6B5D4D',
  inactive: '#A89878',
  gold: '#C9922A',
  surfaceVariant: '#EDE0CC',
};
*/




export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
