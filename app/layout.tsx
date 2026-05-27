import "./globals.css";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { checkIsPremium } from "@/lib/premium";

export const metadata = { title: "Homework Tracker", description: "Your homework, in one place." };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isPremium = user ? await checkIsPremium() : false;

  return (
    <html lang="en">
      <body>
        {user && (
          <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-1 overflow-x-auto">
              <Link href="/" className="font-bold text-blue-600 mr-4 whitespace-nowrap">📚 Homework Tracker</Link>
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/tasks">Assignments</NavLink>
              <NavLink href="/today">Today</NavLink>
              <NavLink href="/missing">Missing</NavLink>
              <NavLink href="/settings">Settings</NavLink>
              {!isPremium && (
                <Link
                  href="/upgrade"
                  className="ml-2 px-3 py-1.5 rounded-md text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-300 hover:bg-amber-100 whitespace-nowrap transition-colors"
                >
                  ⭐ Upgrade
                </Link>
              )}
              <form action="/api/auth/signout" method="post" className="ml-auto">
                <button className="text-sm text-slate-500 hover:text-slate-900">Sign out</button>
              </form>
            </div>
          </nav>
        )}
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-slate-200 mt-8 py-4 text-center text-xs text-slate-400">
          Copyright © 2026 The Heller Psychology Group, LLC. All rights reserved.
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap">
      {children}
    </Link>
  );
}
