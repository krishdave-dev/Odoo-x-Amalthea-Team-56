"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  CheckSquare,
  Settings as SettingsIcon,
  LogOut,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { name: "Projects", href: "/project", icon: FolderKanban },
  { name: "Tasks", href: "/task", icon: CheckSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={
        `sticky top-0 z-30 h-screen shrink-0 border-r bg-[#1A3D63] text-white ` +
        (collapsed ? "w-16" : "w-64")
      }
    >
      {/* Header / Brand */}
      {collapsed ? (
        <div className="flex items-center justify-center h-14 px-3">
          {/* Only toggle in collapsed state (logo removed) */}
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-100 hover:bg-white/10"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center justify-between h-14 px-3">
          <Link href="/project" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <span className="text-lg font-bold">O</span>
            </div>
            <span className="text-lg font-semibold">OneFlow</span>
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-100 hover:bg-white/10"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* User */}
      <div className="px-3">
        {collapsed ? (
          <div className="flex items-center justify-center py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <span className="text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md bg-white/5 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <span className="text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-blue-100/80">{user?.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                `group flex items-center gap-3 rounded-md ${
                  collapsed ? "justify-center px-0" : "px-3"
                } py-2 text-sm transition-colors ` +
                (isActive
                  ? "bg-white/15 text-white"
                  : "text-blue-100 hover:bg-white/10 hover:text-white")
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <Button
          onClick={logout}
          variant="secondary"
          className={`w-full justify-start bg-white/10 text-white hover:bg-white/20 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
