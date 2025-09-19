import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = { title: "Estate Commission", description: "Lifecycle & commission tracker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen text-gray-900">
        <Navbar />
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </body>
    </html>
  );
}
