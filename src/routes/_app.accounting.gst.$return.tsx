import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getGstReturnData } from '@/api/gst.api'
import type { GstParams } from '@/api/gst.api'
import type { GstReturnData } from '@/types/models'
import { ExportButtons } from '@/components/data/export-buttons'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'

export const Route = createFileRoute('/_app/accounting/gst/$return')({
  component: GstReturnDataPage,
})

const RETURN_TITLES: Record<string, string> = {
  gstr1: 'GSTR-1 Data',
  gstr3b: 'GSTR-3B Summary',
  cmp08: 'CMP-08 Data',
  gstr4: 'GSTR-4 Annual Return',
}

function generatePeriodOptions(): Array<{ label: string; value: string }> {
  const options: Array<{ label: string; value: string }> = []
  const months = [
    'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar',
  ]
  const now = new Date()
  const currentYear = now.getFullYear()
  const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1

  for (let fy = fyStartYear; fy >= fyStartYear - 1; fy--) {
    for (let i = 0; i < 12; i++) {
      const year = i < 9 ? fy : fy + 1
      const monthIndex = (i + 3) % 12
      const value = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
      options.push({
        label: `${months[i]} ${year}`,
        value,
      })
    }
  }
  return options
}

function GstReturnDataPage() {
  const { return: returnType } = Route.useParams()
  const periodOptions = useMemo(() => generatePeriodOptions(), [])
  const [period, setPeriod] = useState(periodOptions[0]?.value ?? '')

  const params: GstParams = useMemo(() => ({ period }), [period])

  const { data: raw, isLoading } = useQuery({
    queryKey: queryKeys.gst.returnData(returnType, params as Record<string, unknown>),
    queryFn: () => getGstReturnData(returnType, params).then((res) => res.data),
  })

  const returnData = raw as GstReturnData | undefined

  const title = RETURN_TITLES[returnType] ?? `${returnType.toUpperCase()} Data`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(val) => setPeriod(val ?? period)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButtons
            reportType={`gst_${returnType}`}
            filters={{ period }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : returnData && returnData.columns && returnData.data ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                {returnData.columns.map((col) => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnData.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={returnData.columns.length}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No data available for this period.
                  </TableCell>
                </TableRow>
              ) : (
                returnData.data.map((row, idx) => (
                  <TableRow key={idx}>
                    {returnData.columns.map((col) => (
                      <TableCell key={col.key}>
                        {String(row[col.key] ?? '-')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No data available for this period.
        </p>
      )}
    </div>
  )
}
