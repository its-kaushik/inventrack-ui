import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportReport } from '@/api/reports.api'
import { toast } from 'sonner'

interface ExportButtonsProps {
  reportType: string
  filters?: Record<string, unknown>
}

export function ExportButtons({ reportType, filters = {} }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setExporting(format)
    try {
      const response = await exportReport(reportType, format, filters)
      const { message } = response.data
      toast.success(message ?? 'Export queued. You will be notified when ready.')
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('xlsx')}
        disabled={!!exporting}
      >
        {exporting === 'xlsx' ? (
          <Loader2 className="mr-1.5 size-4 animate-spin" />
        ) : (
          <Download className="mr-1.5 size-4" />
        )}
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={!!exporting}
      >
        {exporting === 'pdf' ? (
          <Loader2 className="mr-1.5 size-4 animate-spin" />
        ) : (
          <Download className="mr-1.5 size-4" />
        )}
        PDF
      </Button>
    </div>
  )
}
