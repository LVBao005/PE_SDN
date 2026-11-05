import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "ExpenseTrail - Personal Expense Tracker",
  description: "Track and organize your personal spending effortlessly with ExpenseTrail",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <ExpenseProvider>
            <Header />
            <main className="flex-1">{children}</main>
          </ExpenseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

