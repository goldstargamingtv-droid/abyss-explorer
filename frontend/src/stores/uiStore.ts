import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Command palette
  commandPaletteOpen: boolean;

  // View modes
  viewMode: "list" | "grid" | "graph";
  editorMode: "edit" | "preview" | "split";

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleCommandPalette: () => void;
  setViewMode: (mode: "list" | "grid" | "graph") => void;
  setEditorMode: (mode: "edit" | "preview" | "split") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarWidth: 280,
      commandPaletteOpen: false,
      viewMode: "list",
      editorMode: "split",

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setViewMode: (mode) => set({ viewMode: mode }),
      setEditorMode: (mode) => set({ editorMode: mode }),
    }),
    {
      name: "pkm-ui-storage",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        viewMode: state.viewMode,
        editorMode: state.editorMode,
      }),
    }
  )
);
