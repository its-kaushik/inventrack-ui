import { useState } from 'react'
import { Loader2, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { DateRangePicker } from '@/components/form/date-range-picker'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { exportReport } from '@/api/reports.api'

interface ReportViewerProps {
  title: string
  reportType: string
  columns: Column<Record<string, unknown>>[]
  data: Record<string, unknown>[]
  summary?: Record<string, number>
  loading?: boolean
  filters?: React.ReactNode  // custom filter bar slot
  dateRange?: { from: Date | null; to: Date | null }
  onDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void
}

export function ReportViewer({
  title,
  reportType,
  columns,
  data,
  summary,
  loading,
  filters,
  dateRange,
  onDateRangeChange,
}: ReportViewerProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setExporting(format)
    try {
      const filterParams: Record<string, unknown> = {}
      if (dateRange?.from) filterParams.date_from = dateRange.from.toISOString()
      if (dateRange?.to) filterParams.date_to = dateRange.to.toISOString()
      await exportReport(reportType, format, filterParams)
    } catch { /* toast error */ } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
            <Printer className="mr-1.5 size-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={!!exporting} className="no-print">
            {exporting === 'xlsx' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Download className="mr-1.5 size-4" />} Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={!!exporting} className="no-print">
            {exporting === 'pdf' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Download className="mr-1.5 size-4" />} PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 no-print">
        {onDateRangeChange && (
          <DateRangePicker value={dateRange ?? { from: null, to: null }} onChange={onDateRangeChange} />
        )}
        {filters}
      </div>

      {/* Summary cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries(summary).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold"><Amount value={value} /></p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Data table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : data.length === 0 ? (
        <EmptyState title="No data" description="No records found for the selected filters." />
      ) : (
        <DataTable data={data} columns={columns} />
      )}
    </div>
  )
}
