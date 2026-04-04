import { createFileRoute, Link } from '@tanstack/react-router'
import { Upload, ArrowLeft } from 'lucide-react'
import { EmptyState } from '@/components/data/empty-state'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_app/inventory/import')({
  component: BulkImportPage,
})

function BulkImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/inventory/products">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Bulk Import</h1>
          <p className="text-sm text-muted-foreground">
            Upload a CSV or Excel file to import products in bulk.
          </p>
        </div>
      </div>

      {/* Drop zone placeholder */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-16">
        <EmptyState
          icon={Upload}
          title="Coming Soon"
          description="Bulk product import via CSV or Excel file will be available in a future update. You can add products one at a time using the Add Product form."
        />
      </div>
    </div>
  )
}
