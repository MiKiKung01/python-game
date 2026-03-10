/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== Theme-aware semantic colors (CSS variables) =====
        't': {
          'bg': 'var(--t-bg)',
          'bg-soft': 'var(--t-bg-soft)',
          'card': 'var(--t-card)',
          'card-hover': 'var(--t-card-hover)',
          'input': 'var(--t-input)',
          'text': 'var(--t-text)',
          'text-soft': 'var(--t-text-soft)',
          'muted': 'var(--t-muted)',
          'accent': 'var(--t-accent)',
          'accent-soft': 'var(--t-accent-soft)',
          'accent-hover': 'var(--t-accent-hover)',
          'accent-2': 'var(--t-accent-2)',
          'border': 'var(--t-border)',
          'border-accent': 'var(--t-border-accent)',
          'glow': 'var(--t-glow)',
          'glass': 'var(--t-glass)',
          'glass-border': 'var(--t-glass-border)',
          'window-bg': 'var(--t-window-bg)',
          'window-titlebar': 'var(--t-window-titlebar)',
          'danger': 'var(--t-danger)',
          'danger-soft': 'var(--t-danger-soft)',
          'success': 'var(--t-success)',
          'success-soft': 'var(--t-success-soft)',
          'overlay': 'var(--t-overlay)',
          'icon-bg': 'var(--t-icon-bg)',
          'icon-bg-hover': 'var(--t-icon-bg-hover)',
          'icon-border': 'var(--t-icon-border)',
        },
        // ===== Static accent colors (same across themes) =====
        'cyber': {
          'blue': '#00d4ff',
          'green': '#00ff88',
          'purple': '#a855f7',
          'dark': '#0a0e1a',
          'darker': '#050810',
        },
        'neon': {
          'pink': '#ff0080',
          'orange': '#ff6b35',
          'yellow': '#ffd700',
        },
        'cat': {
          'orange': '#F97316',
          'amber': '#F59E0B',
          'light': '#FDBA74',
          'dark': '#C2410C',
        },
        // ===== Friend's learning app color tokens =====
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'accent': 'var(--color-accent)',
        'primary': 'var(--color-primary)',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-3px, 3px)' },
          '40%': { transform: 'translate(-3px, -3px)' },
          '60%': { transform: 'translate(3px, 3px)' },
          '80%': { transform: 'translate(3px, -3px)' },
          '100%': { transform: 'translate(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px var(--t-glow), 0 0 10px var(--t-glow)' },
          '50%': { boxShadow: '0 0 20px var(--t-glow), 0 0 40px var(--t-glow)' },
        },
        neonPulse: {
          '0%, 100%': { textShadow: '0 0 5px var(--t-accent), 0 0 10px var(--t-accent)' },
          '50%': { textShadow: '0 0 20px var(--t-accent), 0 0 40px var(--t-accent)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        catTail: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
        catBlink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
        progressBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        slideMenu: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        rotateIn: {
          '0%': { opacity: '0', transform: 'rotate(-10deg) scale(0.9)' },
          '100%': { opacity: '1', transform: 'rotate(0) scale(1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'scanline': 'scanline 8s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'cat-tail': 'catTail 1.5s ease-in-out infinite',
        'cat-blink': 'catBlink 4s ease-in-out infinite',
        'progress': 'progressBar 3s ease-out forwards',
        'slide-menu': 'slideMenu 0.25s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'rotate-in': 'rotateIn 0.4s ease-out',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
    },
  },
  plugins: [],
}