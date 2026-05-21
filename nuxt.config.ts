import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  modules: ["@nuxtjs/supabase"],
  supabase: {
    redirect: false,
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit", "@vueuse/core"],
    },
  },
  nitro: {
    preset: "vercel",
  },
});
