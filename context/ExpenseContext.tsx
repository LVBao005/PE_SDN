"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  note: string;
  starred: boolean;
  spentAt: string;
  createdAt: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  total: number;
}

export interface ExpenseSummary {
  count: number;
  starredCount: number;
  totalAmount: number;
  breakdown: CategoryBreakdown[];
}

interface ExpenseContextType {
  expenses: Expense[];
  summary: ExpenseSummary;
  loading: boolean;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  starredFilter: boolean;
  setStarredFilter: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  clearFilters: () => void;
  fetchExpenses: () => Promise<void>;
  addExpense: (data: {
    title: string;
    amount: number;
    category: string;
    note?: string;
    spentAt: string;
  }) => Promise<{ success: boolean; error?: string; expense?: Expense }>;
  toggleStar: (id: string, currentStarred: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultSummary: ExpenseSummary = {
  count: 0,
  starredCount: 0,
  totalAmount: 0,
  breakdown: [],
};

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>(defaultSummary);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [starredFilter, setStarredFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const clearFilters = () => {
    setCategoryFilter("");
    setStarredFilter(false);
    setSearchQuery("");
  };

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setSummary(defaultSummary);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter.trim()) {
        params.append("category", categoryFilter.trim());
      }
      if (starredFilter) {
        params.append("starred", "true");
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const [resExpenses, resSummary] = await Promise.all([
        fetch(`/api/expenses${queryString}`),
        fetch(`/api/expenses/summary${queryString}`),
      ]);

      if (resExpenses.ok && resSummary.ok) {
        const dataExpenses = await resExpenses.json();
        const dataSummary = await resSummary.json();
        setExpenses(dataExpenses);
        setSummary(dataSummary);
      }
    } catch (e) {
      console.error("fetchExpenses error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter, starredFilter, searchQuery]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // When user logs out, clear immediately
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setSummary(defaultSummary);
      clearFilters();
    }
  }, [user]);

  const addExpense = async (data: {
    title: string;
    amount: number;
    category: string;
    note?: string;
    spentAt: string;
  }) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || "Failed to add expense" };
      }

      await fetchExpenses();
      return { success: true, expense: json };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to add expense" };
    }
  };

  const toggleStar = async (id: string, currentStarred: boolean) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !currentStarred }),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || "Failed to update star" };
      }

      await fetchExpenses();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update star" };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || "Failed to delete expense" };
      }

      await fetchExpenses();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to delete expense" };
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        summary,
        loading,
        categoryFilter,
        setCategoryFilter,
        starredFilter,
        setStarredFilter,
        searchQuery,
        setSearchQuery,
        clearFilters,
        fetchExpenses,
        addExpense,
        toggleStar,
        deleteExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpense must be used within an ExpenseProvider");
  }
  return context;
}

