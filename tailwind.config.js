// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:       '#091812',
          surface:  '#0f2318',
          accent:   '#003a30',
          dark:     '#00271f',
          border:   'rgba(255,255,255,0.07)',
        },
        // Reutiliza los grises de Tailwind — ya los tienes:
        // gray-100 #f3f4f6  → texto activo (usa white mejor)
        // gray-400 #9ca3af  → texto inactivo
        // gray-500 #6b7280  → muted
        // gray-600 #4b5563  → deep/iconos
      },
      borderRadius: {
        card: '16px',
        modal: '20px',
      },
    },
  },
}