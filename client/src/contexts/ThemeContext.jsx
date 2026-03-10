import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BUILT_IN_THEMES, THEME_CYBERPUNK_DARK } from '../themes/themes';

const ThemeContext = createContext(null);

// =============================================
// THEME PROVIDER
// =============================================
// Manages theme state, applies CSS variables to <html>,
// and provides API for switching/registering themes.
//
// Usage in components:
//   const { theme, setTheme, themes, registerTheme } = useTheme();
//
// Future Theme Shop integration:
//   registerTheme(purchasedThemeObject) — adds a new theme at runtime
//   setTheme('purchased-theme-id') — switches to it
// =============================================

export function ThemeProvider({ children }) {
    // Load all themes (built-in + any saved custom ones)
    const [themes, setThemes] = useState(() => {
        try {
            const custom = JSON.parse(localStorage.getItem('game_custom_themes') || '[]');
            return [...BUILT_IN_THEMES, ...custom];
        } catch {
            return [...BUILT_IN_THEMES];
        }
    });

    // Load active theme ID from localStorage
    const [activeThemeId, setActiveThemeId] = useState(() => {
        return localStorage.getItem('game_theme') || THEME_CYBERPUNK_DARK.id;
    });

    // Get current theme object
    const activeTheme = themes.find(t => t.id === activeThemeId) || THEME_CYBERPUNK_DARK;

    // Apply CSS variables to <html> whenever theme changes
    useEffect(() => {
        const root = document.documentElement;

        // Set data-theme attribute (useful for CSS selectors)
        root.setAttribute('data-theme', activeTheme.id);

        // Apply all CSS variables
        Object.entries(activeTheme.colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Save preference
        localStorage.setItem('game_theme', activeTheme.id);
    }, [activeTheme]);

    // Switch theme by ID
    const setTheme = useCallback((themeId) => {
        if (themes.find(t => t.id === themeId)) {
            setActiveThemeId(themeId);
        } else {
            console.warn(`Theme "${themeId}" not found`);
        }
    }, [themes]);

    // Register a new theme (for future Theme Shop)
    // Persists to localStorage so it survives page reloads
    const registerTheme = useCallback((themeObj) => {
        if (!themeObj?.id || !themeObj?.colors) {
            console.error('Invalid theme object. Must have id and colors.');
            return false;
        }
        setThemes(prev => {
            // Replace if exists, add if new
            const existing = prev.findIndex(t => t.id === themeObj.id);
            const updated = [...prev];
            if (existing >= 0) {
                updated[existing] = themeObj;
            } else {
                updated.push(themeObj);
            }
            // Persist custom themes
            const customOnly = updated.filter(t => !BUILT_IN_THEMES.find(b => b.id === t.id));
            localStorage.setItem('game_custom_themes', JSON.stringify(customOnly));
            return updated;
        });
        return true;
    }, []);

    // Unregister a custom theme
    const unregisterTheme = useCallback((themeId) => {
        // Can't remove built-in themes
        if (BUILT_IN_THEMES.find(t => t.id === themeId)) return false;

        setThemes(prev => {
            const updated = prev.filter(t => t.id !== themeId);
            const customOnly = updated.filter(t => !BUILT_IN_THEMES.find(b => b.id === t.id));
            localStorage.setItem('game_custom_themes', JSON.stringify(customOnly));
            return updated;
        });

        // If removing the active theme, switch to default
        if (activeThemeId === themeId) {
            setActiveThemeId(THEME_CYBERPUNK_DARK.id);
        }
        return true;
    }, [activeThemeId]);

    const value = {
        theme: activeTheme,           // Current theme object
        themeId: activeTheme.id,      // Current theme ID
        setTheme,                      // Switch theme by ID
        themes,                        // All available themes
        registerTheme,                 // Add a new theme
        unregisterTheme,               // Remove a custom theme
        isDark: activeTheme.id.includes('dark'), // Quick check
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook for consuming theme
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
