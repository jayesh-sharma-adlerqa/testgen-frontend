import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setSession: ({ token, user }) => set({ token, user }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ token: null, user: null }),
      isAuthed: () => Boolean(get().token),
    }),
    {
      name: "testgen_auth_v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);