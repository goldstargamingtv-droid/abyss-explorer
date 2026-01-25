"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  FileText,
  Search,
  Network,
  FolderOpen,
  Tags,
  Sparkles,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Search", href: "/search", icon: Search },
  { name: "Graph", href: "/graph", icon: Network },
  { name: "Collections", href: "/collections", icon: FolderOpen },
  { name: "Tags", href: "/tags", icon: Tags },
  { name: "Insights", href: "/insights", icon: Sparkles },
  { name: "Import", href: "/import", icon: Upload },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/documents" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary shrink-0" />
          {sidebarOpen && (
            <span className="text-lg font-semibold">PKM Vault</span>
          )}
        </Link>
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-16 h-6 w-6 rounded-full border bg-background shadow-sm"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Secondary navigation */}
      <div className="border-t p-2">
        {secondaryNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
