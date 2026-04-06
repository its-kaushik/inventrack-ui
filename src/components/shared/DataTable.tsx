import { type ReactNode, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  className,
}: DataTableProps<T>) {
  const handleSort = useCallback(
    (key: string) => {
      if (!onSort) return;
      const nextDirection =
        sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(key, nextDirection);
    },
    [onSort, sortKey, sortDirection],
  );

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, colIndex) => (
              <TableHead
                key={col.key}
                className={cn(
                  colIndex === 0 && 'sticky left-0 z-10 bg-white',
                  col.sortable && 'cursor-pointer select-none',
                  col.className,
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  col.sortable && sortKey === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex size-4 items-center justify-center" aria-hidden="true">
                      {sortKey === col.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 text-neutral-300" />
                      )}
                    </span>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={cn(rowIndex % 2 === 0 && 'bg-neutral-50')}
            >
              {columns.map((col, colIndex) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    colIndex === 0 && 'sticky left-0 z-10 bg-inherit',
                    col.className,
                  )}
                >
                  {col.render
                    ? col.render(row, rowIndex)
                    : (row[col.key] as ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
