import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="text-lg font-semibold">Estate Commission</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/transactions" className="hover:underline">İşlemler</Link>
          <Link href="/agents" className="hover:underline">Ajanlar</Link>
        </div>
      </nav>
    </header>
  );
}
