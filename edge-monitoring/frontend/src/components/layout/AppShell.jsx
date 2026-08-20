import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavRail from './NavRail';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import MobileNav from './MobileNav';

export default function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="premium-bands relative flex h-screen w-full overflow-hidden bg-base text-ink">
      {/* Ambient decorative background — purely atmospheric, never a data visualization. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-electric/10 blur-[120px] animate-drift-slow" />
        <div className="absolute right-0 top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet/10 blur-[120px] animate-drift" />
        <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-magenta/10 blur-[120px] animate-drift-slow" />
        <div className="noise-overlay absolute inset-0" />
      </div>

      <NavRail />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar onOpenCommandPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto px-6 py-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
