/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: "#FFF8E7",
        brutal: "#1A1A1A",
        orange: "#FF4D00",
        lime: "#CCFF00",
        violet: "#D4B3FF",
        whatsapp: "#25D366",
      },
      fontFamily: {
        grotesk: ["SpaceGrotesk_700Bold"],
        groteskMedium: ["SpaceGrotesk_500Medium"],
        mono: ["SpaceMono_400Regular"],
        monoBold: ["SpaceMono_700Bold"],
      },
      borderRadius: {
        squircle: "24px",
      },
    },
  },
  plugins: [],
};

