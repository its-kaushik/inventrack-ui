import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { DateRangePicker, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useReport, useExportCSV } from '@/hooks/use-reports';
import { formatINR } from '@/lib/currency';
import { formatDate, toISODate } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import type { ReportParams } from '@/api/reports.api';

import { REPORT_CONFIGS, type ReportColumn } from './reportConfigs';

// ── Constants ──

const CHART_COLORS = [
  '#4F46E5',
  '#F59E0B',
  '#22C55E',
  '#3B82F6',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

const PRIMARY_COLOR = CHART_COLORS[0];

// ── Formatting helpers ──

function formatCellValue(value: unknown, format?: ReportColumn['format']): string {
  if (value == null || value === '') return '--';

  switch (format) {
    case 'currency':
      return formatINR(Number(value));
    case 'number':
      return Number(value).toLocaleString('en-IN');
    case 'date':
      return formatDate(value as string);
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    default:
      return String(value);
  }
}

// ── Sub-components ──

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 desktop:px-6">
      <Skeleton className="h-[72px] w-full rounded-lg" />
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

function ReportNotFound() {
  return (
    <div className="pb-20">
      <PageHeader title="Report" showBack />
      <EmptyState
        icon={BarChart3}
        title="Report not found"
        description="The requested report does not exist. Please go back and select a valid report."
      />
    </div>
  );
}

interface ReportChartProps {
  chartType: 'bar' | 'line' | 'pie';
  data: Record<string, unknown>[];
  dataKey: string;
  categoryKey: string;
}

function ReportChart({ chartType, data, dataKey, categoryKey }: ReportChartProps) {
  if (data.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-700">Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={categoryKey}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                }}
              />
              <Bar dataKey={dataKey} fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={categoryKey}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={PRIMARY_COLOR}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={categoryKey}
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={(props: PieLabelRenderProps) =>
                  `${props.name ?? ''} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`
                }
                labelLine
              >
                {data.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                }}
              />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ReportTableProps {
  columns: ReportColumn[];
  data: Record<string, unknown>[];
}

function ReportTable({ columns, data }: ReportTableProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.format === 'currency' || col.format === 'number' || col.format === 'percent'
                      ? 'text-right'
                      : 'text-left',
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.format === 'currency' || col.format === 'number' || col.format === 'percent'
                        ? 'text-right tabular-nums'
                        : 'text-left',
                    )}
                  >
                    {formatCellValue(row[col.key], col.format)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Main component ──

export default function ReportViewerPage() {
  const { reportKey } = useParams<{ reportKey: string }>();
  const config = reportKey ? REPORT_CONFIGS[reportKey] : undefined;

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const params: ReportParams | undefined = useMemo(() => {
    if (!startDate && !endDate) return undefined;
    const p: ReportParams = {};
    if (startDate) p.startDate = toISODate(startDate);
    if (endDate) p.endDate = toISODate(endDate);
    return p;
  }, [startDate, endDate]);

  // Fetch report data
  const { data: rawData, isLoading, isError } = useReport(
    config?.key ?? '',
    config?.fetcher ?? (() => Promise.resolve({ data: [] })),
    params,
  );

  // CSV export mutation
  const exportCSV = useExportCSV();

  // Normalize data to array
  const tableData = useMemo<Record<string, unknown>[]>(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData as Record<string, unknown>[];
    if (typeof rawData === 'object' && rawData !== null) {
      // Some reports return { rows: [...] } or { items: [...] }
      const obj = rawData as Record<string, unknown>;
      if (Array.isArray(obj.rows)) return obj.rows as Record<string, unknown>[];
      if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
      if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
      // Single object — wrap in array
      return [obj];
    }
    return [];
  }, [rawData]);

  const handleDateChange = useCallback((start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!config?.csvExport) return;
    exportCSV.mutate({
      fetcher: config.csvExport,
      fileName: `${config.key}-${startDate ? toISODate(startDate) : 'all'}.csv`,
      params,
    });
  }, [config, exportCSV, params, startDate]);

  const handleExportPDF = useCallback(() => {
    window.print();
    toast.success('Print dialog opened');
  }, []);

  // ── Guard: config not found ──
  if (!config) {
    return <ReportNotFound />;
  }

  // ── Render ──
  const showChart = config.chartType && config.chartType !== 'none' && config.chartDataKey && config.chartCategoryKey;

  return (
    <div className="pb-20">
      <PageHeader title={config.title} showBack />

      <div className="flex flex-col gap-4 px-4 desktop:px-6">
        {/* Date range picker */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateChange}
        />

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2">
          {config.csvExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exportCSV.isPending}
            >
              <Download className="mr-1.5 size-4" />
              {exportCSV.isPending ? 'Exporting...' : 'Export CSV'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="mr-1.5 size-4" />
            Export PDF
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && <ReportSkeleton />}

        {/* Error state */}
        {isError && !isLoading && (
          <EmptyState
            icon={BarChart3}
            title="Failed to load report"
            description="Something went wrong while fetching the report data. Please try again."
          />
        )}

        {/* Empty state */}
        {!isLoading && !isError && tableData.length === 0 && (
          <EmptyState
            icon={BarChart3}
            title="No data"
            description="No data found for the selected date range. Try adjusting the filters."
          />
        )}

        {/* Chart */}
        {!isLoading && !isError && tableData.length > 0 && showChart && (
          <ReportChart
            chartType={config.chartType as 'bar' | 'line' | 'pie'}
            data={tableData}
            dataKey={config.chartDataKey!}
            categoryKey={config.chartCategoryKey!}
          />
        )}

        {/* Data table */}
        {!isLoading && !isError && tableData.length > 0 && (
          <ReportTable columns={config.columns} data={tableData} />
        )}
      </div>
    </div>
  );
}
