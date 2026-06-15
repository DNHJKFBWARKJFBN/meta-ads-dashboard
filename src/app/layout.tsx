import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/lib/context";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ES_ADS BOARD",
  description: "Meta 광고 성과 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full flex bg-[#F5F6FA]">
        <DashboardProvider>
          <Sidebar />
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}
