import type { Metadata } from "next";
import "./globals.css";
import SidebarLayout from "@/components/SidebarLayout";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "T-REPORT",
  description: "Application de rapport et d'analyse des transactions financières",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <AuthProvider>
          <SidebarLayout>
            {children}
          </SidebarLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
