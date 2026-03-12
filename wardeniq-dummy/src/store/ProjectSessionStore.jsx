import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useProjectSessionStore = create(
  persist(
    (set) => ({
      activeProject: null,
      activeFeature: null,
      activeVersion: null,

      setActiveProject: (project) => {
        if (!project?.id) return;

        set({
          activeProject: {
            id: String(project.id),
            name: project.name ? String(project.name) : "",
            description: project.description ? String(project.description) : "",
          },
          activeFeature: null,
          activeVersion: null,
        });
      },

      clearActiveProject: () =>
        set({
          activeProject: null,
          activeFeature: null,
          activeVersion: null,
        }),

      setActiveFeature: (feature) => {
        if (!feature?.id) return;

        set({
          activeFeature: {
            id: String(feature.id),
            name: feature.name ? String(feature.name) : "",
            description: feature.description ? String(feature.description) : "",
          },
          activeVersion: null,
        });
      },

      setActiveVersion: (number) => {
        const n = Number(number);
        if (!Number.isFinite(n)) return;

        set({ activeVersion: { number: n } });
      },

      clearActiveVersion: () => set({ activeVersion: null }),

      clearActiveFeature: () =>
        set({
          activeFeature: null,
          activeVersion: null,
        }),

      clearAll: () =>
        set({
          activeProject: null,
          activeFeature: null,
          activeVersion: null,
        }),
    }),
    {
      name: "testgen_project_session_v3",
      version: 3,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeProject: state.activeProject,
        activeFeature: state.activeFeature,
        activeVersion: state.activeVersion,
      }),
    }
  )
);