import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listUsers, updateUser, resetUserPassword } from '@/api/users.api'
import type { User } from '@/types/models'
import type { UserRole } from '@/types/enums'
import { DataTable, type Column } from '@/components/data/data-table'
import { StatusBadge } from '@/components/data/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

export const Route = createFileRoute('/_app/settings/users')({
  component: UserManagementPage,
})

const roleLabel: Record<UserRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  salesperson: 'Salesperson',
  super_admin: 'Super Admin',
}

const roleBadgeVariant: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  manager: 'secondary',
  salesperson: 'outline',
  super_admin: 'default',
}

function UserManagementPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editRoleUser, setEditRoleUser] = useState<User | null>(null)
  const [editRoleValue, setEditRoleValue] = useState<UserRole>('salesperson')
  const [resetPwUser, setResetPwUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.users.all(),
    queryFn: () => listUsers().then((res) => res.data),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast.success('User status updated.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update user.')
    },
  })

  const editRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUser(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast.success('User role updated.')
      setEditRoleUser(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update role.')
    },
  })

  const resetPwMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, password),
    onSuccess: () => {
      toast.success('Password has been reset.')
      setResetPwUser(null)
      setNewPassword('')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password.')
    },
  })

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => <span className="font-medium">{user.name}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user) => user.phone,
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge variant={roleBadgeVariant[user.role]}>
          {roleLabel[user.role]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <StatusBadge variant={user.isActive !== false ? 'success' : 'error'}>
          {user.isActive !== false ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => {
        if (user.role === 'owner') {
          return <span className="text-xs text-muted-foreground">--</span>
        }
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setEditRoleUser(user)
                setEditRoleValue(user.role)
              }}
            >
              Edit Role
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                toggleActiveMutation.mutate({
                  id: user.id,
                  isActive: user.isActive === false,
                })
              }}
            >
              {user.isActive !== false ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setResetPwUser(user)
                setNewPassword('')
              }}
            >
              Reset PW
            </Button>
          </div>
        )
      },
      hideOnMobile: true,
    },
  ]

  const mobileCard = (user: User) => (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-muted">
              {user.role === 'owner' ? (
                <ShieldCheck className="size-4 text-primary" />
              ) : user.role === 'manager' ? (
                <Shield className="size-4 text-muted-foreground" />
              ) : (
                <UserIcon className="size-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.phone}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={roleBadgeVariant[user.role]} className="text-[10px]">
              {roleLabel[user.role]}
            </Badge>
            <StatusBadge variant={user.isActive !== false ? 'success' : 'error'}>
              {user.isActive !== false ? 'Active' : 'Inactive'}
            </StatusBadge>
          </div>
        </div>
        {user.role !== 'owner' && (
          <div className="mt-2 flex gap-1 border-t pt-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setEditRoleUser(user)
                setEditRoleValue(user.role)
              }}
            >
              Edit Role
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                toggleActiveMutation.mutate({
                  id: user.id,
                  isActive: user.isActive === false,
                })
              }}
            >
              {user.isActive !== false ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setResetPwUser(user)
                setNewPassword('')
              }}
            >
              Reset PW
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage staff accounts and permissions.
            </p>
          </div>
        </div>
        <Button onClick={() => navigate({ to: '/settings/users/new' })}>
          <Plus className="mr-1 size-4" />
          Add User
        </Button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        loading={isLoading}
        emptyMessage="No users found"
        mobileCard={mobileCard}
      />

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUser} onOpenChange={(open) => !open && setEditRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Change role for {editRoleUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={editRoleValue}
              onValueChange={(val) => setEditRoleValue(val as UserRole)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="salesperson">Salesperson</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditRoleUser(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editRoleUser) {
                  editRoleMutation.mutate({ id: editRoleUser.id, role: editRoleValue })
                }
              }}
              disabled={editRoleMutation.isPending}
            >
              {editRoleMutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPwUser} onOpenChange={(open) => !open && setResetPwUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPwUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resetPwUser && newPassword.length >= 6) {
                  resetPwMutation.mutate({ id: resetPwUser.id, password: newPassword })
                } else {
                  toast.error('Password must be at least 6 characters.')
                }
              }}
              disabled={resetPwMutation.isPending}
            >
              {resetPwMutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
