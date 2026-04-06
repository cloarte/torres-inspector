import { useLocation, Link } from "react-router-dom";
import { Truck, Bell, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "RUTAS",
    items: [
      {
        label: "Rutas del Día",
        icon: Truck,
        path: "/inspector/rutas",
        badge: 3,
      },
    ],
  },
  {
    label: "VENCIDOS",
    items: [
      {
        label: "Alertas de Vencimiento",
        icon: Bell,
        path: "/inspector/alertas",
      },
    ],
  },
  {
    label: "CUENTA",
    items: [
      { label: "Mi Perfil", icon: User, path: "/inspector/perfil" },
    ],
  },
];

interface Props {
  open: boolean;
}

export function InspectorSidebar({ open }: Props) {
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "h-full bg-primary flex flex-col shrink-0 transition-[width] duration-200 ease-out overflow-hidden",
        open ? "w-56" : "w-14"
      )}
    >
      <nav className="flex-1 py-4 space-y-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && (
              <div className="mx-3 my-3 border-t border-sidebar-border" />
            )}
            {open && (
              <p className="px-4 text-[11px] font-semibold tracking-wider text-primary-foreground/40 uppercase mb-1">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 min-h-[48px] px-4 mx-1 rounded-md transition-colors text-base",
                    active
                      ? "bg-primary-light text-primary font-medium"
                      : "text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground"
                  )}
                  title={item.label}
                >
                  <item.icon size={20} className="shrink-0" />
                  {open && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {open && item.badge != null && item.badge > 0 && (
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        {open ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
              IC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-foreground truncate">
                Inspector
              </p>
              <p className="text-xs text-primary-foreground/50">Calidad</p>
            </div>
            <button className="min-h-[48px] min-w-[48px] flex items-center justify-center text-primary-foreground/50 hover:text-primary-foreground transition-colors active:scale-95">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            className="min-h-[48px] min-w-[48px] flex items-center justify-center text-primary-foreground/50 hover:text-primary-foreground transition-colors mx-auto active:scale-95"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
