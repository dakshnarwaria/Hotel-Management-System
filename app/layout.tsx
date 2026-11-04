import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hearth & Stay | Hotel Management",
  description: "Hotel operations and booking management.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body>
        <ToastProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
