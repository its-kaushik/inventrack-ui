import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Outlet, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface POSLayoutProps {
  /** Store name displayed in the header */
  storeName?: string;
  children?: React.ReactNode;
}

export function POSLayout({
  storeName = 'Kaushik Vastra Bhandar',
  children,
}: POSLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-dvh flex-col bg-neutral-50">
      {/* ── Minimal POS Top Bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <span className="text-base font-semibold text-neutral-800">
          {storeName}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          aria-label="Exit POS"
        >
          <X className="size-5" />
        </Button>
      </header>

      {/* ── Full-screen content ── */}
      <main className={cn('flex-1 overflow-y-auto')}>
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
