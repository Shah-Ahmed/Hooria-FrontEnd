import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TechProject",
  description: "Organizations and users management (Next.js + Firebase)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-light">
        <AuthProvider>
          <Navbar />
          <main className="container py-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
