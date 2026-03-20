import { useState, createContext, useContext, ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { InspectorSidebar } from "./InspectorSidebar";

interface LayoutContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType>({
  sidebarOpen: true,
  toggleSidebar: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export function InspectorLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <LayoutContext.Provider
      value={{ sidebarOpen, toggleSidebar: () => setSidebarOpen((v) => !v) }}
    >
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-14 bg-primary flex items-center px-4 shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-md text-primary-foreground hover:bg-sidebar-accent transition-colors active:scale-95"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="ml-3 flex items-center gap-2">
            <span className="text-primary-foreground font-semibold text-lg tracking-tight">
              Torres SGV
            </span>
            <span className="text-primary-foreground/50 mx-1">·</span>
            <span className="text-primary-foreground/70 text-sm">
              Inspector de Calidad
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              INSPECTOR
            </span>
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-primary-foreground text-sm font-semibold">
              IC
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <InspectorSidebar open={sidebarOpen} />
          <main className="flex-1 overflow-y-auto bg-background p-4">
            {children}
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
