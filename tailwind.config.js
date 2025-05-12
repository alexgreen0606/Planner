/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    './app/**/*.{js,tsx,ts,jsx}',
    './src/**/*.{js,tsx,ts,jsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
