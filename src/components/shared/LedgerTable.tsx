import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';

export interface LedgerEntry {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
}

interface LedgerTableProps {
  entries: LedgerEntry[];
  className?: string;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function LedgerTable({ entries, className }: LedgerTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-white">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              key={index}
              className={cn(index % 2 === 0 && 'bg-neutral-50')}
            >
              <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
                {entry.date}
              </TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell className="text-right">
                {entry.debit != null && entry.debit > 0 ? (
                  <span className="text-error-700">{formatAmount(entry.debit)}</span>
                ) : (
                  <span className="text-neutral-300">&mdash;</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {entry.credit != null && entry.credit > 0 ? (
                  <span className="text-success-700">{formatAmount(entry.credit)}</span>
                ) : (
                  <span className="text-neutral-300">&mdash;</span>
                )}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatAmount(entry.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
