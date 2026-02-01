import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Account Master Pro',
        short_name: 'AccountPro',
        description: 'GST business management',
        theme_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [{src: '/placeholder.svg', sizes: '512x512', type: 'image/svg+xml'}]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000, // Increase to 3MB
        // Or disable precaching for large files:
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-native": "react-native-web",
      "b4a/react-native": "b4a", 
      "react-query/lib/react/reactBatchedUpdates.native": "react-query/lib/react/reactBatchedUpdates",
    },
  },
}));
