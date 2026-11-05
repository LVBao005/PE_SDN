"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Layers, ShieldCheck, Sparkles, Star } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6">
      {/* Hero Section */}
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          <span>Simple, Powerful Personal Expense Tracker</span>
        </div>

        <h1
          data-testid="home-title"
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900"
        >
          ExpenseTrail
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Take full control of your finances. Record every transaction, organize expenses by categories, highlight important items, and get instant visual insights into your spending habits.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          {user ? (
            <Button size="lg" asChild className="gap-2 text-base">
              <Link href="/expenses">
                Go to My Expenses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild className="gap-2 text-base">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-16">
        <Card className="border-slate-200 hover:shadow-md transition">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Track spending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Easily record daily transactions with precise dates, amounts, and notes to keep full visibility over your budget.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <Layers className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Sort into categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Classify your expenses into Food, Transport, Bills, Shopping, and Other to understand where your money actually flows.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <Star className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">See where it goes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Star critical payments, search keywords instantly, and view live breakdowns with automatic tie-break sorting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

