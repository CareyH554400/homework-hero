import "./globals.css";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Homework Tracker", description: "Your homework, in one place." };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
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
              <form action="/api/auth/signout" method="post" className="ml-auto">
                <button className="text-sm text-slate-500 hover:text-slate-900">Sign out</button>
              </form>
            </div>
          </nav>
        )}
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
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
