import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  milestone: string;
}

export default function PlaceholderPage({ title, milestone }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Construction className="size-12 text-neutral-300" />
      <h1 className="text-xl font-bold text-neutral-800">{title}</h1>
      <p className="text-sm text-neutral-500">
        This page will be built in milestone <span className="font-mono font-medium text-primary-600">{milestone}</span>
      </p>
    </div>
  );
}
