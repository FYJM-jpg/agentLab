import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Agent Lab",
  description: "Agent Lab - Next.js + Python backend"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
