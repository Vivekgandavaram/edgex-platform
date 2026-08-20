/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#05070B',
        surface: '#090D14',
        panel: 'rgba(255,255,255,0.05)',
        'panel-strong': 'rgba(255,255,255,0.08)',
        border: 'rgba(255,255,255,0.10)',
        'border-strong': 'rgba(255,255,255,0.16)',
        ink: '#F5F7FA',
        muted: '#929AAA',
        electric: '#3B82F6',
        cyan: '#22D3EE',
        violet: '#8B5CF6',
        magenta: '#D946EF',
        pink: '#EC4899',
        orange: '#F97316',
        emerald: '#10B981',
        amber: '#F59E0B',
        crimson: '#F43F5E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 40px rgba(59,130,246,0.15)',
      },
      backgroundImage: {
        'gradient-blue-cyan': 'linear-gradient(135deg, #3B82F6, #22D3EE)',
        'gradient-violet-magenta': 'linear-gradient(135deg, #8B5CF6, #D946EF)',
        'gradient-pink-orange': 'linear-gradient(135deg, #EC4899, #F97316)',
        'gradient-cyan-blue': 'linear-gradient(135deg, #22D3EE, #3B82F6)',
      },
      keyframes: {
        drift: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(2%, -3%) scale(1.05)' } },
        pulseGlow: { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 28s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
