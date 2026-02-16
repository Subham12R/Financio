/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A1A',
        secondary: '#333333',
        accent: '#0066CC',
        'bg-light': '#FFFFFF',
        'bg-medium': '#F5F5F5',
        'bg-gray': '#FAFAFA',
        border: '#E5E5E5',
        'border-dark': '#CCCCCC',
        'text-primary': '#1A1A1A',
        'text-secondary': '#666666',
        'text-muted': '#999999',
        success: '#22C55E',
        error: '#DC2626',
      },
    },
  },
  plugins: [],
}
