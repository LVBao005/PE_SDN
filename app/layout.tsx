import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ReadingLogProvider } from "@/context/ReadingLogContext";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "ReadLog - Personal Reading Tracker",
  description: "Track and organize your personal reading sessions effortlessly with ReadLog",
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
          <ReadingLogProvider>
            <Header />
            <main className="flex-1">{children}</main>
          </ReadingLogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
