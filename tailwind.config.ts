import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-mode="dark"]'],
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './public/**/*.html',
    './index.html',
  ],
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1400px',
      xxxl: '1650px',
    },
    extend: {
      colors: {
        main: {
          bg: 'var(--main-bg)',
          mask: 'var(--mask-bg)',
          border: 'var(--main-border-color)',
        },
        text: {
          DEFAULT: 'var(--text-color)',
          muted: 'var(--text-muted-color)',
          highlight: 'var(--text-muted-highlight-color)',
          heading: 'var(--heading-color)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          border: 'var(--sidebar-border-color)',
          muted: 'var(--sidebar-muted-color)',
          active: 'var(--sidebar-active-color)',
          hover: 'var(--sidebar-hover-bg)',
          btn: 'var(--sidebar-btn-bg)',
          btnColor: 'var(--sidebar-btn-color)',
        },
        topbar: {
          bg: 'var(--topbar-bg)',
          text: 'var(--topbar-text-color)',
        },
        card: {
          bg: 'var(--card-bg)',
          hover: 'var(--card-hover-bg)',
          header: 'var(--card-header-bg)',
        },
        link: {
          DEFAULT: 'var(--link-color)',
          underline: 'var(--link-underline-color)',
        },
        toc: {
          highlight: 'var(--toc-highlight)',
        },
        prompt: {
          text: 'var(--prompt-text-color)',
          tip: {
            bg: 'var(--prompt-tip-bg)',
            icon: 'var(--prompt-tip-icon-color)',
          },
          info: {
            bg: 'var(--prompt-info-bg)',
            icon: 'var(--prompt-info-icon-color)',
          },
          warning: {
            bg: 'var(--prompt-warning-bg)',
            icon: 'var(--prompt-warning-icon-color)',
          },
          danger: {
            bg: 'var(--prompt-danger-bg)',
            icon: 'var(--prompt-danger-icon-color)',
          },
        },
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '10px',
        xl: '16px',
      },
      boxShadow: {
        card: 'var(--card-shadow)',
      },
    },
  },
  plugins: [],
};

export default config;
