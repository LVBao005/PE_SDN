"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useReadingLog } from "@/context/ReadingLogContext";
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
  BookOpen,
  Clock,
} from "lucide-react";

const GENRES = ["Fiction", "Non-Fiction", "Sci-Fi", "Biography", "Other"] as const;

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReadingLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    readingLogs,
    summary,
    genreFilter,
    setGenreFilter,
    favoriteFilter,
    setFavoriteFilter,
    searchQuery,
    setSearchQuery,
    clearFilters,
    addReadingLog,
    toggleFavorite,
    deleteReadingLog,
  } = useReadingLog();

  // Form states
  const [bookTitle, setBookTitle] = useState("");
  const [minutesRead, setMinutesRead] = useState("");
  const [genre, setGenre] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  // Field validation functions
  const getBookTitleError = () => {
    if (!hasSubmitted) return "";
    if (!bookTitle.trim()) return "Book title is required";
    if (bookTitle.trim().length > 80) return "Book title must be at most 80 characters";
    return "";
  };

  const getMinutesError = () => {
    if (!hasSubmitted) return "";
    if (minutesRead === "" || minutesRead === undefined || minutesRead === null) return "Minutes read is required";
    const num = Number(minutesRead);
    if (isNaN(num)) return "Minutes read is required";
    if (num <= 0) return "Minutes read must be a positive number";
    return "";
  };

  const getGenreError = () => {
    if (!hasSubmitted) return "";
    if (!genre.trim()) return "Please choose a genre";
    if (!GENRES.includes(genre.trim() as any)) return "Invalid genre";
    return "";
  };

  const getDateError = () => {
    if (!hasSubmitted) return "";
    if (!date.trim()) return "Date is required";
    const todayStr = getTodayString();
    if (date.trim() > todayStr) return "Date cannot be in the future";
    return "";
  };

  const bookTitleError = getBookTitleError();
  const minutesError = getMinutesError();
  const genreError = getGenreError();
  const dateError = getDateError();

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFormError("");
    setSuccessMessage("");

    // Validate
    let isValid = true;
    if (!bookTitle.trim() || bookTitle.trim().length > 80) isValid = false;
    const num = Number(minutesRead);
    if (minutesRead === "" || isNaN(num) || num <= 0) isValid = false;
    if (!genre.trim() || !GENRES.includes(genre.trim() as any)) isValid = false;
    const todayStr = getTodayString();
    if (!date.trim() || date.trim() > todayStr) isValid = false;

    if (!isValid) return;

    setIsSubmitting(true);
    const result = await addReadingLog({
      bookTitle: bookTitle.trim(),
      minutesRead: Math.round(num),
      genre: genre.trim(),
      note: note.trim(),
      readOn: date.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("Reading session added");
      setBookTitle("");
      setMinutesRead("");
      setGenre("");
      setNote("");
      setDate("");
      setHasSubmitted(false);
    } else {
      setFormError(result.error || "Failed to add reading session");
    }
  };

  return (
    <div data-testid="reading-logs-page" className="container mx-auto max-w-6xl py-8 px-4 sm:px-6">
      <div className="flex flex-col gap-8">
        {/* Top Summary Bar */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-indigo-50/50 via-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-xl font-bold text-slate-900">Reading Summary</CardTitle>
              </div>
            </div>
            <CardDescription>Live overview of currently filtered reading sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
              <div className="rounded-lg bg-white p-4 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sessions</p>
                <p data-testid="reading-log-count" className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.count}
                </p>
              </div>

              <div className="rounded-lg bg-white p-4 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Favorites
                </p>
                <p data-testid="favorite-count" className="text-2xl font-bold text-amber-700 mt-1">
                  {summary.favoriteCount}
                </p>
              </div>

              <div className="rounded-lg bg-white p-4 border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Total Minutes</p>
                <p data-testid="total-minutes" className="text-2xl font-bold text-indigo-700 mt-1">
                  {summary.totalMinutes}
                </p>
              </div>
            </div>

            {/* Genre Breakdown */}
            <div data-testid="genre-breakdown" className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Genre Breakdown
              </h4>
              {summary.breakdown.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No genre data for current filter.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {summary.breakdown.map((b) => (
                    <div
                      key={b.genre}
                      data-testid="breakdown-row"
                      className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-xs"
                    >
                      <div>
                        <span data-testid="breakdown-name" className="font-semibold text-sm text-slate-800">
                          {b.genre}
                        </span>
                        <div className="text-xs text-slate-500">
                          <span data-testid="breakdown-count">{b.count}</span> {b.count === 1 ? "session" : "sessions"}
                        </div>
                      </div>
                      <span data-testid="breakdown-total" className="text-sm font-bold text-slate-900">
                        {b.total}
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
          {/* Add Reading Session Form (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <Card className="border-slate-200 shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-600" />
                  Add a Reading Session
                </CardTitle>
                <CardDescription>Enter details of your reading session</CardDescription>
              </CardHeader>
              <CardContent>
                {formError && (
                  <div
                    data-testid="error-reading-log"
                    className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {successMessage && (
                  <div
                    data-testid="reading-log-success"
                    className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form
                  data-testid="reading-log-form"
                  noValidate
                  onSubmit={handleAddSubmit}
                  className="space-y-4"
                >
                  {/* Book Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-book-title">Book Title</Label>
                    <Input
                      id="input-book-title"
                      data-testid="input-book-title"
                      value={bookTitle}
                      onChange={(e) => {
                        setBookTitle(e.target.value);
                        if (formError) setFormError("");
                        if (successMessage) setSuccessMessage("");
                      }}
                      placeholder="e.g. Atomic Habits, Clean Code"
                      disabled={isSubmitting}
                    />
                    {bookTitleError && (
                      <p data-testid="error-book-title" className="text-xs text-rose-600 font-medium">
                        {bookTitleError}
                      </p>
                    )}
                  </div>

                  {/* Minutes Read */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-minutes">Minutes Read</Label>
                    <Input
                      id="input-minutes"
                      type="number"
                      step="1"
                      data-testid="input-minutes"
                      value={minutesRead}
                      onChange={(e) => {
                        setMinutesRead(e.target.value);
                        if (formError) setFormError("");
                        if (successMessage) setSuccessMessage("");
                      }}
                      placeholder="e.g. 40"
                      disabled={isSubmitting}
                    />
                    {minutesError && (
                      <p data-testid="error-minutes" className="text-xs text-rose-600 font-medium">
                        {minutesError}
                      </p>
                    )}
                  </div>

                  {/* Genre Dropdown */}
                  <div className="space-y-1.5">
                    <Label htmlFor="input-genre">Genre</Label>
                    <select
                      id="input-genre"
                      data-testid="input-genre"
                      value={genre}
                      onChange={(e) => {
                        setGenre(e.target.value);
                        if (formError) setFormError("");
                        if (successMessage) setSuccessMessage("");
                      }}
                      disabled={isSubmitting}
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Choose genre</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {genreError && (
                      <p data-testid="error-genre" className="text-xs text-rose-600 font-medium">
                        {genreError}
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
                      placeholder="e.g. Chapter 3, Great insights"
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    data-testid="btn-add-reading-log"
                    className="w-full mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding Session..." : "Add Reading Session"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Reading Log List (lg:col-span-7) */}
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
                      placeholder="Search book title or note..."
                      className="pl-9"
                    />
                  </div>

                  {/* Genre Filter */}
                  <div className="w-full sm:w-44">
                    <select
                      data-testid="filter-genre"
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                    >
                      <option value="">All Genres</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Favorites Filter Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      data-testid="filter-favorite"
                      checked={favoriteFilter}
                      onChange={(e) => setFavoriteFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> Favorites only
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

            {/* Reading Log List */}
            <div data-testid="reading-log-list" className="space-y-3">
              {readingLogs.length === 0 ? (
                <div
                  data-testid="reading-logs-empty"
                  className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500"
                >
                  <Filter className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-base font-medium">No reading sessions found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your filters or record a new reading session above.
                  </p>
                </div>
              ) : (
                readingLogs.map((item) => (
                  <div
                    key={item.id}
                    data-testid="reading-log-item"
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-sm transition"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span data-testid="reading-log-title" className="font-semibold text-slate-900 text-base">
                          {item.bookTitle}
                        </span>
                        <span
                          data-testid="reading-log-genre"
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {item.genre}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span data-testid="reading-log-date">{item.readOn}</span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600">{item.note}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <span data-testid="reading-log-minutes" className="font-bold text-lg text-slate-900">
                        {item.minutesRead}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid="btn-toggle-favorite"
                          aria-pressed={item.favorite ? "true" : "false"}
                          onClick={() => toggleFavorite(item.id, item.favorite)}
                          title={item.favorite ? "Remove favorite" : "Add favorite"}
                          className="h-8 w-8 text-slate-400 hover:text-amber-500"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              item.favorite ? "fill-amber-400 text-amber-500" : ""
                            }`}
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid="btn-delete-reading-log"
                          onClick={() => deleteReadingLog(item.id)}
                          title="Delete session"
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

