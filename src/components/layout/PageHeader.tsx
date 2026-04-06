import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  action,
  showBack = false,
  onBack,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-4 desktop:px-6',
        className
      )}
    >
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="Go back"
          className="-ml-2"
        >
          <ArrowLeft className="size-5" />
        </Button>
      )}

      <h1 className="flex-1 text-xl font-bold text-neutral-900">{title}</h1>

      {action && (
        <Button onClick={action.onClick} size="default">
          {action.icon && <action.icon data-icon="inline-start" className="size-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
