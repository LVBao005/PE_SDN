"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, ArrowRight, User as UserIcon } from "lucide-react";

export function Header() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 hover:text-indigo-700 transition">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <span>ReadLog</span>
        </Link>

        <nav className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/reading-logs"
                    data-testid="link-reading-logs"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 transition px-3 py-1.5 rounded-md hover:bg-slate-100"
                  >
                    Reading Logs
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span data-testid="user-email" className="text-sm font-medium text-slate-700">
                      {user.email}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="btn-logout"
                    onClick={logout}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-rose-600 hover:border-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login" data-testid="btn-login">
                      Login
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register" data-testid="btn-register">
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
