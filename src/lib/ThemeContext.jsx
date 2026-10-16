import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('bethverse-theme');
    return saved || 'light';
  });

  const [fontStyle, setFontStyle] = useState(() => {
    const saved = localStorage.getItem('bethverse-font');
    return saved || 'serif';
  });

  useEffect(() => {
    localStorage.setItem('bethverse-theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bethverse-font', fontStyle);
    const root = document.documentElement;
    root.style.setProperty('--font-body',
      fontStyle === 'serif' ? "'Lora', Georgia, serif" :
      fontStyle === 'modern' ? "'Inter', system-ui, sans-serif" :
      "'Playfair Display', Georgia, serif"
    );
  }, [fontStyle]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontStyle, setFontStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
