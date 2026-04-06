import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { Printer, Download } from 'lucide-react';

interface PrintActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  className?: string;
}

export function PrintActionSheet({
  open,
  onOpenChange,
  onPrint,
  onDownloadPDF,
  className,
}: PrintActionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn('rounded-t-2xl pb-safe', className)}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-neutral-300" />
        </div>

        <SheetHeader>
          <SheetTitle>Print / Download</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-4 pb-4">
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
            onClick={() => {
              onPrint();
              onOpenChange(false);
            }}
          >
            <Printer className="size-5 text-neutral-500" aria-hidden="true" />
            Print via Browser
          </button>

          <button
            type="button"
            className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
            onClick={() => {
              onDownloadPDF();
              onOpenChange(false);
            }}
          >
            <Download className="size-5 text-neutral-500" aria-hidden="true" />
            Download PDF to Share
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
