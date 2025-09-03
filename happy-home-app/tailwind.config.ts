import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Happy Home Brand Colors
        'brand-green': {
          primary: '#006837',
          dark: '#004026',
          light: '#228B4E',
        },
        'brand-gold': {
          light: '#F2D250',
          dark: '#C49A3A',
        },
        
        // Base system colors
        border: "hsl(210 14% 89%)",
        input: "hsl(210 11% 97%)",
        ring: "#006837",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(0 0% 10%)",
        
        // Primary brand colors
        primary: {
          DEFAULT: "#006837",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(210 11% 97%)",
          foreground: "#004026",
        },
        destructive: {
          DEFAULT: "hsl(0 70% 50%)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "hsl(210 11% 95%)",
          foreground: "hsl(215 16% 47%)",
        },
        accent: {
          DEFAULT: "#F2D250",
          foreground: "#004026",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(0 0% 10%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(0 0% 10%)",
        },
        
        // Status colors using brand palette
        success: {
          DEFAULT: "#006837",
          foreground: "hsl(0 0% 100%)",
        },
        warning: {
          DEFAULT: "#C49A3A",
          foreground: "hsl(0 0% 100%)",
        },
        info: {
          DEFAULT: "hsl(221 83% 53%)",
          foreground: "hsl(0 0% 100%)",
        },
      },
      
      // Brand gradients
      backgroundImage: {
        'brand-gold-gradient': 'linear-gradient(135deg, #F2D250 0%, #C49A3A 100%)',
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'heading': ['Playfair Display', 'Georgia', 'serif'],
      },
      
      boxShadow: {
        'brand': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'brand-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}

export default config