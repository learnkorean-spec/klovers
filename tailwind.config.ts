import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindTypography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			xs: '400px',
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			/* Klovers brand palette — concept board, tuned 20 Sep 2026.
  			   Soft fill + strong accent per support colour; see src/index.css. */
  			ivory: 'hsl(var(--ivory))',
  			charcoal: 'hsl(var(--charcoal))',
  			'klovers-yellow': 'hsl(var(--klovers-yellow))',
  			mint: {
  				DEFAULT: 'hsl(var(--mint))',
  				strong: 'hsl(var(--mint-strong))',
  				foreground: 'hsl(var(--mint-foreground))'
  			},
  			peach: {
  				DEFAULT: 'hsl(var(--peach))',
  				strong: 'hsl(var(--peach-strong))',
  				foreground: 'hsl(var(--peach-foreground))'
  			},
  			/* Status colours: functional, outside the three-colour brand palette. */
  			correct: {
  				DEFAULT: 'hsl(var(--correct))',
  				foreground: 'hsl(var(--correct-foreground))'
  			},
  			wrong: {
  				DEFAULT: 'hsl(var(--wrong))',
  				foreground: 'hsl(var(--wrong-foreground))',
  				surface: 'hsl(var(--wrong-surface))',
  				graphic: 'hsl(var(--wrong-graphic))'
  			},
  			/*
  			 * amber — RETUNED, not Tailwind's default.
  			 *
  			 * Six homepage sections used amber-* as the brand yellow: badges,
  			 * chips, glows, stat tiles, the community band. Klovers does not own
  			 * that hue - the board's yellow is #FFFF00 - so amber is pointed at
  			 * the brand yellow here and every existing call site follows,
  			 * instead of forty hand edits that drift apart again.
  			 *
  			 * 600/700/800 break the ramp on purpose. Every call site of those
  			 * three is TEXT on a pale chip, where a mid-yellow fails contrast
  			 * outright; they are dark olive so the text stays readable
  			 * (700 on amber-100 measures 6.1:1). Do not "fix" them back into
  			 * the ramp without checking every text use.
  			 */
  			amber: {
  				50: '#FFFEF0',
  				100: '#FFFAC4',
  				200: '#FFF28F',
  				300: '#FFE84D',
  				400: '#FFDE00',
  				500: '#EFD000',
  				600: '#7A6C00',
  				700: '#6B5E00',
  				800: '#4F4600',
  				900: '#3A3300',
  				950: '#231F00'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' },
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' },
  			},
  			'scroll-left': {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' },
  			},
  			'scroll-right': {
  				'0%': { transform: 'translateX(-50%)' },
  				'100%': { transform: 'translateX(0)' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'scroll-left': 'scroll-left 35s linear infinite',
  			'scroll-right': 'scroll-right 35s linear infinite',
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		fontFamily: {
  			/* Body — Inter for Latin, Cairo for Arabic (Inter has no Arabic). */
  			sans: [
  				'Inter',
  				'Cairo',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			/* Display — headings and campaign lines. */
  			display: [
  				'Poppins',
  				'Cairo',
  				'ui-sans-serif',
  				'system-ui',
  				'Segoe UI',
  				'Arial',
  				'sans-serif'
  			],
  			/*
  			 * Handwritten accent — one line at a time, never a paragraph.
  			 *
  			 * LATIN ONLY, AND THAT IS A KNOWN GAP. Caveat carries no Arabic and
  			 * no Hangul, so every handwritten line on this site renders in Cairo
  			 * for an Arabic reader - the hero's script line included - and looks
  			 * like an ordinary sentence rather than a hand.
  			 *
  			 * Aref Ruqaa was added for this on 20 Sep 2026 and removed the same
  			 * day: it is a calligraphic naskh and reads as a thin formal serif
  			 * at these sizes, not as handwriting. Closing the gap needs a face
  			 * that genuinely looks handwritten in Arabic at ~20px. Until then,
  			 * do not add handwritten decoration that the Arabic side cannot
  			 * render - it is the majority script on this site.
  			 */
  			script: [
  				'Caveat',
  				'Segoe Script',
  				'Brush Script MT',
  				'cursive'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [tailwindcssAnimate, tailwindTypography],
} satisfies Config;
