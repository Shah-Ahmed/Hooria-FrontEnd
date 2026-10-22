import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./theme.css"; // must come after Bootstrap so it can override it
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TechProject",
  description: "Organizations and users management (Next.js + Firebase)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container py-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
