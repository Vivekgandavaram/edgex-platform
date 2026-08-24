import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('edgex_theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem('edgex_theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
