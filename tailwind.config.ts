import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Cores específicas da Lotofácil
        lotofacil: {
          par: "hsl(var(--lotofacil-par))",
          impar: "hsl(var(--lotofacil-impar))",
          moldura: "hsl(var(--lotofacil-moldura))",
          primo: "hsl(var(--lotofacil-primo))",
          repetida: "hsl(var(--lotofacil-repetida))",
        },
        // Cores de palpites
        palpite: {
          dezena: "hsl(var(--palpite-dezena))",
          "dezena-foreground": "hsl(var(--palpite-dezena-foreground))",
          fixa: "hsl(var(--palpite-dezena-fixa))",
          "fixa-foreground": "hsl(var(--palpite-dezena-fixa-foreground))",
        },
        // Cores específicas da Mega Sena
        megasena: {
          primary: "hsl(var(--megasena-primary))",
          "primary-foreground": "hsl(var(--megasena-primary-foreground))",
          excluida: "hsl(var(--megasena-excluida))",
          "excluida-foreground": "hsl(var(--megasena-excluida-foreground))",
        },
        // Cores específicas da Dupla Sena
        duplasena: {
          primary: "hsl(var(--duplasena-primary))",
          "primary-foreground": "hsl(var(--duplasena-primary-foreground))",
          secondary: "hsl(var(--duplasena-secondary))",
          "secondary-foreground": "hsl(var(--duplasena-secondary-foreground))",
          excluida: "hsl(var(--duplasena-excluida))",
          "excluida-foreground": "hsl(var(--duplasena-excluida-foreground))",
        },
        // Status Quente/Frio
        status: {
          quente: "hsl(var(--status-quente))",
          "quente-foreground": "hsl(var(--status-quente-foreground))",
          "quente-bg": "hsl(var(--status-quente-bg))",
          frio: "hsl(var(--status-frio))",
          "frio-foreground": "hsl(var(--status-frio-foreground))",
          "frio-bg": "hsl(var(--status-frio-bg))",
        },
        // Botão de destaque (CTA verde claro)
        highlight: {
          DEFAULT: "hsl(var(--highlight))",
          foreground: "hsl(var(--highlight-foreground))",
        },
      },
      fontSize: {
        // Tipografia otimizada para idosos
        "senior-sm": ["1rem", { lineHeight: "1.5" }],
        "senior-base": ["1.125rem", { lineHeight: "1.6" }],
        "senior-lg": ["1.25rem", { lineHeight: "1.5" }],
        "senior-xl": ["1.5rem", { lineHeight: "1.4" }],
        "senior-2xl": ["1.875rem", { lineHeight: "1.3" }],
        "senior-3xl": ["2.25rem", { lineHeight: "1.2" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
