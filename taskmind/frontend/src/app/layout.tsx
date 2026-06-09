import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskMind",
  description: "Gestor de tarefas pessoal com IA proativa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}
