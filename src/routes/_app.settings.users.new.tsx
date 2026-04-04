import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createUser } from '@/api/users.api'
import type { UserRole } from '@/types/enums'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  role: z.enum(['manager', 'salesperson']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

export const Route = createFileRoute('/_app/settings/users/new')({
  component: CreateUserPage,
})

function CreateUserPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      role: 'salesperson',
      password: '',
    },
  })

  const selectedRole = watch('role')

  const mutation = useMutation({
    mutationFn: (data: CreateUserFormValues) =>
      createUser({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        role: data.role as UserRole,
        password: data.password,
      }),
    onSuccess: () => {
      toast.success('User created successfully.')
      navigate({ to: '/settings/users' })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create user.')
    },
  })

  function onSubmit(data: CreateUserFormValues) {
    mutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/settings/users">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create User</h1>
          <p className="text-sm text-muted-foreground">
            Add a new staff member to your store.
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>New Staff Member</CardTitle>
          <CardDescription>
            They will be able to log in and use the system based on their role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Full name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit phone number"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setValue('role', val as 'manager' | 'salesperson')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="salesperson">Salesperson</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedRole === 'manager'
                  ? 'Managers can manage products, stock, and view reports.'
                  : 'Salespersons can create bills and view their own sales.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
                Create User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
