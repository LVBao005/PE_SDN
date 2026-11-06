"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface ReadingLog {
  id: string;
  bookTitle: string;
  minutesRead: number;
  genre: string;
  note: string;
  favorite: boolean;
  readOn: string;
  createdAt: string;
}

export interface GenreBreakdown {
  genre: string;
  count: number;
  total: number;
}

export interface ReadingLogSummary {
  count: number;
  favoriteCount: number;
  totalMinutes: number;
  breakdown: GenreBreakdown[];
}

interface ReadingLogContextType {
  readingLogs: ReadingLog[];
  summary: ReadingLogSummary;
  loading: boolean;
  genreFilter: string;
  setGenreFilter: (genre: string) => void;
  favoriteFilter: boolean;
  setFavoriteFilter: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  clearFilters: () => void;
  fetchReadingLogs: () => Promise<void>;
  addReadingLog: (data: {
    bookTitle: string;
    minutesRead: number;
    genre: string;
    note?: string;
    readOn: string;
  }) => Promise<{ success: boolean; error?: string; log?: ReadingLog }>;
  toggleFavorite: (id: string, currentFavorite: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteReadingLog: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultSummary: ReadingLogSummary = {
  count: 0,
  favoriteCount: 0,
  totalMinutes: 0,
  breakdown: [],
};

const ReadingLogContext = createContext<ReadingLogContextType | undefined>(undefined);

export function ReadingLogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);
  const [summary, setSummary] = useState<ReadingLogSummary>(defaultSummary);
  const [loading, setLoading] = useState(false);

  const [genreFilter, setGenreFilter] = useState("");
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const clearFilters = () => {
    setGenreFilter("");
    setFavoriteFilter(false);
    setSearchQuery("");
  };

  const fetchReadingLogs = useCallback(async () => {
    if (!user) {
      setReadingLogs([]);
      setSummary(defaultSummary);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (genreFilter.trim()) {
        params.append("genre", genreFilter.trim());
      }
      if (favoriteFilter) {
        params.append("favorite", "true");
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const [resLogs, resSummary] = await Promise.all([
        fetch(`/api/reading-logs${queryString}`),
        fetch(`/api/reading-logs/summary${queryString}`),
      ]);

      if (resLogs.ok && resSummary.ok) {
        const dataLogs = await resLogs.json();
        const dataSummary = await resSummary.json();
        setReadingLogs(dataLogs);
        setSummary(dataSummary);
      }
    } catch (e) {
      console.error("fetchReadingLogs error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, genreFilter, favoriteFilter, searchQuery]);

  useEffect(() => {
    fetchReadingLogs();
  }, [fetchReadingLogs]);

  useEffect(() => {
    if (!user) {
      setReadingLogs([]);
      setSummary(defaultSummary);
      clearFilters();
    }
  }, [user]);

  const addReadingLog = async (data: {
    bookTitle: string;
    minutesRead: number;
    genre: string;
    note?: string;
    readOn: string;
  }) => {
    try {
      const res = await fetch("/api/reading-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || "Failed to add reading session" };
      }

      await fetchReadingLogs();
      return { success: true, log: json };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to add reading session" };
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const res = await fetch(`/api/reading-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !currentFavorite }),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || "Failed to update favorite" };
      }

      await fetchReadingLogs();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update favorite" };
    }
  };

  const deleteReadingLog = async (id: string) => {
    try {
      const res = await fetch(`/api/reading-logs/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || "Failed to delete reading session" };
      }

      await fetchReadingLogs();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to delete reading session" };
    }
  };

  return (
    <ReadingLogContext.Provider
      value={{
        readingLogs,
        summary,
        loading,
        genreFilter,
        setGenreFilter,
        favoriteFilter,
        setFavoriteFilter,
        searchQuery,
        setSearchQuery,
        clearFilters,
        fetchReadingLogs,
        addReadingLog,
        toggleFavorite,
        deleteReadingLog,
      }}
    >
      {children}
    </ReadingLogContext.Provider>
  );
}

export function useReadingLog() {
  const context = useContext(ReadingLogContext);
  if (!context) {
    throw new Error("useReadingLog must be used within a ReadingLogProvider");
  }
  return context;
}

