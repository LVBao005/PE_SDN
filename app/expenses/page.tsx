"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExpense } from "@/context/ExpenseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Star,
  Trash2,
  PlusCircle,
  Search,
  Filter,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  PieChart,
} from "lucide-react";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Other"] as const;

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    expenses,
    summary,
    categoryFilter,
    setCategoryFilter,
    starredFilter,
    setStarredFilter,
    searchQuery,
    setSearchQuery,
    clearFilters,
    addExpense,
    toggleStar,
    deleteExpense,
  } = useExpense();

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  // Field validation functions
  const getTitleError = () => {
    if (!hasSubmitted) return "";
    if (!title.trim()) return "Title is required";
    if (title.trim().length > 80) return "Title must be at most 80 characters";
    return "";
  };

  const getAmountError = () => {
    if (!hasSubmitted) return "";
    if (amount === "" || amount === undefined || amount === null) return "Amount is required";
    const num = Number(amount);
    if (isNaN(num)) return "Amount is required";
    if (num <= 0) return "Amount must be a positive number";
    return "";
  };

  const getCategoryError = () => {
    if (!hasSubmitted) return "";
    if (!category.trim()) return "Please choose a category";
    if (!CATEGORIES.includes(category.trim() as any)) return "Invalid category";
    return "";
  };

  const getDateError = () => {
    if (!hasSubmitted) return "";
    if (!date.trim()) return "Date is required";
    const todayStr = getTodayString();
    if (date.trim() > todayStr) return "Date cannot be in the future";
    return "";
  };

  const titleError = getTitleError();
  const amountError = getAmountError();
  const categoryError = getCategoryError();
  const dateError = getDateError();

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFormError("");
    setSuccessMessage("");

    // Validate
    let isValid = true;
    if (!title.trim() || title.trim().length > 80) isValid = false;
    const num = Number(amount);
    if (amount === "" || isNaN(num) || num <= 0) isValid = false;
    if (!category.trim() || !CATEGORIES.includes(category.trim() as any)) isValid = false;
    const todayStr = getTodayString();
    if (!date.trim() || date.trim() > todayStr) isValid = false;

    if (!isValid) return;

    setIsSubmitting(true);
    const result = await addExpense({
      title: title.trim(),
      amount: num,
      category: category.trim(),
      note: note.trim(),
      spentAt: date.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("Expense added");
      setTitle("");
      setAmount("");
      setCategory("");
      setNote("");
      setDate("");
      setHasSubmitted(false);
    } else {
      setFormError(result.error || "Failed to add expense");
    }
  };

  return (
    <div data-testid="expenses-page" className="container mx-auto max-w-6xl py-8 px-4 sm:px-6">
      <div className="flex flex-col gap-8">
        {/* Top Summary Bar */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-indigo-50/50 via-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-xl font-bold text-slate-900">Spending Overview</CardTitle>
              </div>
            </div>
            <CardDescription>Live analytics of currently filtered expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
              <div className="rounded-lg bg-white p-4 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Expenses</p>
                <p data-testid="expense-count" className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.count}
                </p>
              </div>

              <div className="rounded-lg bg-white p-4 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Starred Items
                </p>
                <p data-testid="starred-count" className="text-2xl font-bold text-amber-700 mt-1">
                  {summary.starredCount}
                </p>
              </div>

              <div className="rounded-lg bg-white p-4 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Total Amount</p>
                <p data-testid="total-amount" className="text-2xl font-bold text-indigo-700 mt-1">
                  {summary.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div data-testid="category-breakdown" className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Category Breakdown
              </h4>
              {summary.breakdown.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No category data for current filter.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {summary.breakdown.map((b) => (
                    <div
                      key={b.category}
                      data-testid="breakdown-row"
                      className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-xs"
                    >
                      <div>
                        <span data-testid="breakdown-name" className="font-semibold text-sm text-slate-800">
                          {b.category}
                        </span>
                        <div className="text-xs text-slate-500">
                          <span data-testid="breakdown-count">{b.count}</span> {b.count === 1 ? "expense" : "expenses"}
                        </div>
                      </div>
                      <span data-testid="breakdown-total" className="text-sm font-bold text-slate-900">
                        {b.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Grid: Form on Left/Top, List on Right/Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Expense Form (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <Card className="border-slate-200 shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-600" />
                  Add New Expense
                </CardTitle>
                <CardDescription>Enter details of the transaction</CardDescription>
              </CardHeader>
              <CardContent>
                {formError && (
                  <div
                    data-testid="error-expense"
                    className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {successMessage && (
                  <div
                    data-testid="expense-success"
                    className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form
                  data-testid="expense-form"
                  noValidate
                  onSubmit={handleAddSubmit}
                  className="space-y-4"
                >
                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-title">Title</Label>
                    <Input
                      id="input-title"
                      data-testid="input-title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (formError) setFormError("");
                        if (successMessage) setSuccessMessage("");
                      }}
                      placeholder="e.g. Grab to campus, Lunch"
                      disabled={isSubmitting}
                    />
                    {titleError && (
                      <p data-testid="error-title" className="text-xs text-rose-600 font-medium">
                        {titleError}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-amount">Amount</Label>
                    <Input
                      id="input-amount"
                      type="number"
                      step="any"
                      data-testid="input-amount"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (formError) setFormError("");
                        if (successMessage) setSuccessMessage("");
                      }}
                      placeholder="e.g. 45000"
                      disabled={isSubmitting}
                    />
                    {amountError && (
                      <p data-testid="error-amount" className="text-xs text-rose-600 font-medium">
                        {amountError}
                      </p>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-category">Category</Label>
                    <select
                      id="input-category"
                      data-testid="input-category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (formError) setFormError("");
                        if (successMessage) setSuccessMessage("");
                      }}
                      disabled={isSubmitting}
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Choose category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {categoryError && (
                      <p data-testid="error-category" className="text-xs text-rose-600 font-medium">
                        {categoryError}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-date">Date</Label>
                    <Input
                      id="input-date"
                      type="date"
                      data-testid="input-date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        if (formError) setFormError("");
                        if (successMessage) setSuccessMessage("");
                      }}
                      disabled={isSubmitting}
                    />
                    {dateError && (
                      <p data-testid="error-date" className="text-xs text-rose-600 font-medium">
                        {dateError}
                      </p>
                    )}
                  </div>

                  {/* Optional Note */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-note">Note (Optional)</Label>
                    <Input
                      id="input-note"
                      data-testid="input-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Morning class with friends"
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    data-testid="btn-add-expense"
                    className="w-full mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding Expense..." : "Add Expense"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Expense List (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Filter Toolbar */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      data-testid="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title or note..."
                      className="pl-9"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="w-full sm:w-44">
                    <select
                      data-testid="filter-category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Starred Filter Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      data-testid="filter-starred"
                      checked={starredFilter}
                      onChange={(e) => setStarredFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> Starred only
                    </span>
                  </label>

                  {/* Clear Filters Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="btn-clear-filters"
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Expenses List */}
            <div data-testid="expense-list" className="space-y-3">
              {expenses.length === 0 ? (
                <div
                  data-testid="expenses-empty"
                  className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500"
                >
                  <Filter className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-base font-medium">No expenses found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your filters or record a new expense above.
                  </p>
                </div>
              ) : (
                expenses.map((item) => (
                  <div
                    key={item.id}
                    data-testid="expense-item"
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-sm transition"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span data-testid="expense-title" className="font-semibold text-slate-900 text-base">
                          {item.title}
                        </span>
                        <span
                          data-testid="expense-category"
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span data-testid="expense-date">{item.spentAt}</span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600">{item.note}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <span data-testid="expense-amount" className="font-bold text-lg text-slate-900">
                        {item.amount.toFixed(2)}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid="btn-toggle-star"
                          aria-pressed={item.starred ? "true" : "false"}
                          onClick={() => toggleStar(item.id, item.starred)}
                          title={item.starred ? "Remove star" : "Add star"}
                          className="h-8 w-8 text-slate-400 hover:text-amber-500"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              item.starred ? "fill-amber-400 text-amber-500" : ""
                            }`}
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid="btn-delete-expense"
                          onClick={() => deleteExpense(item.id)}
                          title="Delete expense"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

