import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Refund Agent",
  description: "Self-hosted customer support with LangGraph",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}