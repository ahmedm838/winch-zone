
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { ThemeToggle } from "./ThemeToggle";
import { signOut, getMyRole, RoleName } from "../lib/auth";
import { useEffect, useState } from "react";

type Tab = { to: string; label: string; roles: RoleName[] };

const tabs: Tab[] = [
  { to: "/dashboard/customers/new", label: "New customer", roles: ["admin"] },
  { to: "/dashboard/customers", label: "Edit/Show customer", roles: ["admin"] },
  { to: "/dashboard/trips/record", label: "Record trip", roles: ["admin", "user"] },
  { to: "/dashboard/trips/edit", label: "Edit trip", roles: ["admin", "user"] },
  { to: "/dashboard/trips/pending", label: "Pending trips", roles: ["admin"] },
  { to: "/dashboard/trips/export", label: "Export trips", roles: ["admin"] },
  { to: "/dashboard/users", label: "Users roles", roles: ["admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [role, setRole] = useState<RoleName | null>(null);

  useEffect(() => {
    getMyRole().then(setRole);
  }, []);

  const visible = role ? tabs.filter((t) => t.roles.includes(role)) : [];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Winch Zone" className="h-10 w-auto" />
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Winch Zone</div>
              <div className="text-xs text-slate-500">Car service rental</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={async () => {
                await signOut();
                nav("/");
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <aside className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 h-fit bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="px-2 py-2 text-xs text-slate-500">Dashboard</div>
          <nav className="flex flex-col">
            {visible.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  "rounded-xl px-3 py-2 text-sm " +
                  (isActive
                    ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900")
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
