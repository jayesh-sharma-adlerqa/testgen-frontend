import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark",
      hasHydrated: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "testgen_theme_v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);