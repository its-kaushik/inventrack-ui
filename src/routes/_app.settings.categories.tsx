import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Pencil, Ban } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import {
  listCategories,
  createCategory,
  updateCategory,
  listSizeSystems,
  createSizeSystem,
  updateSizeSystem,
  listBrands,
  createBrand,
  updateBrand,
} from '@/api/categories.api'
import type { Category, SizeSystem, Brand } from '@/types/models'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'

export const Route = createFileRoute('/_app/settings/categories')({
  component: CategoryManagementPage,
})

// ---------- Schemas ----------

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  sortOrder: z.number().optional(),
})
type CategoryFormValues = z.infer<typeof categorySchema>

const sizeSystemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  values: z.string().min(1, 'Enter at least one size value'),
})
type SizeSystemFormValues = z.infer<typeof sizeSystemSchema>

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
})
type BrandFormValues = z.infer<typeof brandSchema>

// ---------- Main Page ----------

function CategoryManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/settings">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Categories & Sizes</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories, size systems, and brands.
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories">
        <TabsList variant="line">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sizes">Size Systems</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="sizes">
          <SizeSystemsTab />
        </TabsContent>
        <TabsContent value="brands">
          <BrandsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Categories Tab ----------

function CategoriesTab() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => listCategories().then((res) => res.data),
  })

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() })
      toast.success('Category created.')
      closeDialog()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create category.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() })
      toast.success('Category updated.')
      closeDialog()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update category.')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => updateCategory(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() })
      toast.success('Category deactivated.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate category.')
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => updateCategory(id, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() })
      toast.success('Category activated.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to activate category.')
    },
  })

  function openCreate() {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingCategory(null)
  }

  function handleSubmitCategory(data: CategoryFormValues) {
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: { name: data.name, code: data.code, sortOrder: data.sortOrder ?? 0 },
      })
    } else {
      createMutation.mutate({
        name: data.name,
        code: data.code,
        sortOrder: data.sortOrder,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Category
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add your first product category to get started."
          action={{ label: 'Add Category', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((cat) => (
            <Card key={cat.id} size="sm">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded bg-muted text-xs font-mono font-medium text-muted-foreground">
                      {cat.sortOrder}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">Code: {cat.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={cat.isActive ? 'success' : 'error'}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    {cat.isActive ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deactivateMutation.mutate(cat.id)}
                      >
                        <Ban className="size-3.5 text-destructive" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => activateMutation.mutate(cat.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        editing={editingCategory}
        onSubmit={handleSubmitCategory}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

function CategoryDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Category | null
  onSubmit: (data: CategoryFormValues) => void
  isPending: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: editing
      ? { name: editing.name, code: editing.code, sortOrder: editing.sortOrder }
      : { name: '', code: '', sortOrder: 0 },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update the category details.' : 'Create a new product category.'}
          </DialogDescription>
        </DialogHeader>
        <form
          id="category-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Footwear"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-code">Code *</Label>
            <Input
              id="cat-code"
              placeholder="e.g. FW"
              aria-invalid={!!errors.code}
              {...register('code')}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-sort">Sort Order</Label>
            <Input
              id="cat-sort"
              type="number"
              min={0}
              {...register('sortOrder', { valueAsNumber: true })}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Size Systems Tab ----------

function SizeSystemsTab() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState<SizeSystem | null>(null)

  const { data: sizeSystems = [], isLoading } = useQuery({
    queryKey: queryKeys.sizeSystems.all(),
    queryFn: () => listSizeSystems().then((res) => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; values: string[] }) => createSizeSystem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sizeSystems.all() })
      toast.success('Size system created.')
      closeDialog()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create size system.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; values: string[] }> }) =>
      updateSizeSystem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sizeSystems.all() })
      toast.success('Size system updated.')
      closeDialog()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update size system.')
    },
  })

  function openCreate() {
    setEditingSystem(null)
    setDialogOpen(true)
  }

  function openEdit(system: SizeSystem) {
    setEditingSystem(system)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingSystem(null)
  }

  function handleSubmitSizeSystem(data: SizeSystemFormValues) {
    const values = data.values
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    if (editingSystem) {
      updateMutation.mutate({ id: editingSystem.id, data: { name: data.name, values } })
    } else {
      createMutation.mutate({ name: data.name, values })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Size System
        </Button>
      </div>

      {sizeSystems.length === 0 ? (
        <EmptyState
          title="No size systems yet"
          description="Add size systems like UK Shoes (6, 7, 8...) or Clothing (S, M, L...)."
          action={{ label: 'Add Size System', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-2">
          {sizeSystems.map((sys) => (
            <Card key={sys.id} size="sm">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sys.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {sys.values.join(', ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(sys)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Size System Dialog */}
      <SizeSystemDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        editing={editingSystem}
        onSubmit={handleSubmitSizeSystem}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

function SizeSystemDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: SizeSystem | null
  onSubmit: (data: SizeSystemFormValues) => void
  isPending: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SizeSystemFormValues>({
    resolver: zodResolver(sizeSystemSchema),
    values: editing
      ? { name: editing.name, values: editing.values.join(', ') }
      : { name: '', values: '' },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Size System' : 'Add Size System'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the size system details.'
              : 'Define a new size system and its values.'}
          </DialogDescription>
        </DialogHeader>
        <form
          id="size-system-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="ss-name">Name *</Label>
            <Input
              id="ss-name"
              placeholder='e.g. "UK Shoe Sizes"'
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ss-values">Values (comma-separated) *</Label>
            <Input
              id="ss-values"
              placeholder="e.g. 6, 7, 8, 9, 10, 11"
              aria-invalid={!!errors.values}
              {...register('values')}
            />
            {errors.values && (
              <p className="text-xs text-destructive">{errors.values.message}</p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="size-system-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Brands Tab ----------

function BrandsTab() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const { data: brands = [], isLoading } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => listBrands().then((res) => res.data),
  })

  const createMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() })
      toast.success('Brand created.')
      closeDialog()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create brand.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; code: string }> }) =>
      updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() })
      toast.success('Brand updated.')
      closeDialog()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update brand.')
    },
  })

  function openCreate() {
    setEditingBrand(null)
    setDialogOpen(true)
  }

  function openEdit(brand: Brand) {
    setEditingBrand(brand)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingBrand(null)
  }

  function handleSubmitBrand(data: BrandFormValues) {
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <EmptyState
          title="No brands yet"
          description="Add brands to organize your products."
          action={{ label: 'Add Brand', onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id} size="sm">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">Code: {brand.code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(brand)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Brand Dialog */}
      <BrandDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        editing={editingBrand}
        onSubmit={handleSubmitBrand}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

function BrandDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Brand | null
  onSubmit: (data: BrandFormValues) => void
  isPending: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    values: editing
      ? { name: editing.name, code: editing.code }
      : { name: '', code: '' },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update the brand details.' : 'Add a new brand.'}
          </DialogDescription>
        </DialogHeader>
        <form
          id="brand-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Name *</Label>
            <Input
              id="brand-name"
              placeholder="e.g. Nike"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-code">Code *</Label>
            <Input
              id="brand-code"
              placeholder="e.g. NK"
              aria-invalid={!!errors.code}
              {...register('code')}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="brand-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
