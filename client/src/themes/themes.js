// =============================================
// THEME DEFINITIONS
// =============================================
// Each theme is a flat object of semantic color tokens.
// To add a new theme (e.g. from a Theme Shop), simply create
// a new object following this format and register it via
// ThemeContext's registerTheme() function.
//
// Token naming convention:
//   --t-bg          : main background
//   --t-bg-soft     : slightly elevated background
//   --t-card        : card / panel background
//   --t-card-hover  : card hover state
//   --t-input       : input field background
//   --t-text        : primary text
//   --t-text-soft   : secondary/muted text
//   --t-muted       : subtle text / labels
//   --t-accent      : primary accent color
//   --t-accent-soft : lighter accent for backgrounds
//   --t-accent-hover: accent hover
//   --t-border      : default border color
//   --t-border-accent: accent-colored border
//   --t-glow        : glow/shadow accent color (rgba)
//   --t-glass       : glass panel background (rgba)
//   --t-glass-border: glass panel border (rgba)
//   --t-gradient-1..5: animated gradient stops
//   --t-grid-line   : grid pattern line color (rgba)
//   --t-scrollbar-track: scrollbar track
//   --t-scrollbar-thumb: scrollbar thumb
//   --t-window-bg   : window background
//   --t-window-titlebar: window title bar
//   --t-boot-bg     : boot screen background
//   --t-boot-text   : boot screen primary text
//   --t-boot-accent : boot screen accent text
// =============================================

export const THEME_CYBERPUNK_DARK = {
    id: 'cyberpunk-dark',
    name: 'Cyberpunk Dark',
    icon: '🌙',
    category: 'default',
    description: 'โทนมืดแบบ Cyberpunk พร้อม neon glow',
    colors: {
        '--t-bg': '#050810',
        '--t-bg-soft': '#0a0e1a',
        '--t-card': 'rgba(15, 23, 42, 0.7)',
        '--t-card-hover': 'rgba(15, 23, 42, 0.85)',
        '--t-input': 'rgba(5, 8, 16, 0.8)',
        '--t-text': '#e2e8f0',
        '--t-text-soft': '#94a3b8',
        '--t-muted': '#64748b',
        '--t-accent': '#00d4ff',
        '--t-accent-soft': 'rgba(0, 212, 255, 0.15)',
        '--t-accent-hover': '#38bdf8',
        '--t-accent-2': '#a855f7',
        '--t-border': 'rgba(255, 255, 255, 0.08)',
        '--t-border-accent': 'rgba(0, 212, 255, 0.3)',
        '--t-glow': 'rgba(0, 212, 255, 0.15)',
        '--t-glass': 'rgba(15, 23, 42, 0.7)',
        '--t-glass-border': 'rgba(255, 255, 255, 0.08)',
        '--t-glass-button': 'rgba(255, 255, 255, 0.05)',
        '--t-glass-button-hover': 'rgba(255, 255, 255, 0.12)',
        '--t-gradient-1': '#050810',
        '--t-gradient-2': '#0a1628',
        '--t-gradient-3': '#0d1f3c',
        '--t-grid-line': 'rgba(0, 212, 255, 0.03)',
        '--t-dot-color': 'rgba(0, 212, 255, 0.15)',
        '--t-scrollbar-track': 'rgba(15, 23, 42, 0.8)',
        '--t-scrollbar-thumb': 'rgba(0, 212, 255, 0.3)',
        '--t-scrollbar-thumb-hover': 'rgba(0, 212, 255, 0.5)',
        '--t-window-bg': '#0d1117',
        '--t-window-titlebar': '#161b22',
        '--t-window-titlebar-inactive': '#0d1117',
        '--t-boot-bg': '#000000',
        '--t-boot-text': '#00ff88',
        '--t-boot-accent': '#00d4ff',
        '--t-boot-scanline': 'rgba(0, 255, 136, 0.15)',
        '--t-particle-1': '#00d4ff',
        '--t-particle-2': '#a855f7',
        '--t-particle-3': '#F97316',
        '--t-shimmer': 'rgba(255, 255, 255, 0.05)',
        '--t-overlay': 'rgba(0, 0, 0, 0.6)',
        '--t-danger': '#ef4444',
        '--t-danger-soft': 'rgba(239, 68, 68, 0.1)',
        '--t-success': '#00ff88',
        '--t-success-soft': 'rgba(0, 255, 136, 0.1)',
        '--t-icon-bg': 'rgba(255, 255, 255, 0.06)',
        '--t-icon-bg-hover': 'rgba(255, 255, 255, 0.12)',
        '--t-icon-border': 'rgba(255, 255, 255, 0.08)',
    }
};

export const THEME_CYBERPUNK_LIGHT = {
    id: 'cyberpunk-light',
    name: 'Cyberpunk Light',
    icon: '☀️',
    category: 'default',
    description: 'โทนสว่างแบบ Soft Cyberpunk',
    colors: {
        '--t-bg': '#f0f4f8',
        '--t-bg-soft': '#e2e8f0',
        '--t-card': 'rgba(255, 255, 255, 0.75)',
        '--t-card-hover': 'rgba(255, 255, 255, 0.9)',
        '--t-input': 'rgba(241, 245, 249, 0.9)',
        '--t-text': '#1e293b',
        '--t-text-soft': '#475569',
        '--t-muted': '#94a3b8',
        '--t-accent': '#0284c7',
        '--t-accent-soft': 'rgba(2, 132, 199, 0.1)',
        '--t-accent-hover': '#0369a1',
        '--t-accent-2': '#7c3aed',
        '--t-border': 'rgba(0, 0, 0, 0.08)',
        '--t-border-accent': 'rgba(2, 132, 199, 0.3)',
        '--t-glow': 'rgba(2, 132, 199, 0.12)',
        '--t-glass': 'rgba(255, 255, 255, 0.75)',
        '--t-glass-border': 'rgba(0, 0, 0, 0.06)',
        '--t-glass-button': 'rgba(0, 0, 0, 0.03)',
        '--t-glass-button-hover': 'rgba(0, 0, 0, 0.08)',
        '--t-gradient-1': '#f0f4f8',
        '--t-gradient-2': '#e0eaf4',
        '--t-gradient-3': '#d0dff0',
        '--t-grid-line': 'rgba(2, 132, 199, 0.06)',
        '--t-dot-color': 'rgba(2, 132, 199, 0.12)',
        '--t-scrollbar-track': 'rgba(226, 232, 240, 0.8)',
        '--t-scrollbar-thumb': 'rgba(2, 132, 199, 0.25)',
        '--t-scrollbar-thumb-hover': 'rgba(2, 132, 199, 0.4)',
        '--t-window-bg': '#ffffff',
        '--t-window-titlebar': '#f8fafc',
        '--t-window-titlebar-inactive': '#f1f5f9',
        '--t-boot-bg': '#f8fafc',
        '--t-boot-text': '#0284c7',
        '--t-boot-accent': '#0369a1',
        '--t-boot-scanline': 'rgba(2, 132, 199, 0.06)',
        '--t-particle-1': '#0284c7',
        '--t-particle-2': '#7c3aed',
        '--t-particle-3': '#F97316',
        '--t-shimmer': 'rgba(0, 0, 0, 0.03)',
        '--t-overlay': 'rgba(255, 255, 255, 0.7)',
        '--t-danger': '#dc2626',
        '--t-danger-soft': 'rgba(220, 38, 38, 0.08)',
        '--t-success': '#16a34a',
        '--t-success-soft': 'rgba(22, 163, 74, 0.08)',
        '--t-icon-bg': 'rgba(0, 0, 0, 0.04)',
        '--t-icon-bg-hover': 'rgba(0, 0, 0, 0.08)',
        '--t-icon-border': 'rgba(0, 0, 0, 0.06)',
    }
};

// =============================================
// THEME REGISTRY
// =============================================
// All built-in themes. Future theme shop themes
// will be added via registerTheme() at runtime.
export const BUILT_IN_THEMES = [
    THEME_CYBERPUNK_DARK,
    THEME_CYBERPUNK_LIGHT,
];
