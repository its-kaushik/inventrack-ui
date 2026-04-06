import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { StatusBadge, ConfirmSheet } from '@/components/shared';
import { PageHeader } from '@/components/layout';
import {
  useUsers,
  useInviteUser,
  useUpdateUser,
  useDeactivateUser,
} from '@/hooks/use-settings';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateTime } from '@/lib/format-date';
import { toast } from 'sonner';
import { UserPlus, Phone, Mail, Clock, Shield } from 'lucide-react';
import type { Role } from '@/types/enums';
import type { User } from '@/types/models';

// ── Schema ──

const inviteUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.enum(['owner', 'manager', 'salesman'], {
    message: 'Role is required',
  }),
});

type InviteUserForm = z.infer<typeof inviteUserSchema>;

// ── Helpers ──

const roleColors: Record<Role, 'blue' | 'green' | 'amber' | 'red'> = {
  super_admin: 'red',
  owner: 'blue',
  manager: 'green',
  salesman: 'amber',
};

const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  manager: 'Manager',
  salesman: 'Salesman',
};

function getAssignableRoles(currentUserRole: Role): Role[] {
  if (currentUserRole === 'super_admin' || currentUserRole === 'owner') {
    return ['owner', 'manager', 'salesman'];
  }
  if (currentUserRole === 'manager') {
    return ['salesman'];
  }
  return [];
}

// ── Loading Skeleton ──

function UserListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── User Card ──

function UserCard({
  user,
  isCurrentUser,
  assignableRoles,
  onChangeRole,
  onDeactivate,
}: {
  user: User;
  isCurrentUser: boolean;
  assignableRoles: Role[];
  onChangeRole: (userId: string, role: Role) => void;
  onDeactivate: (user: User) => void;
}) {
  return (
    <Card className={!user.isActive ? 'opacity-60' : undefined}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-neutral-900">
                  {user.name}
                </h3>
                {isCurrentUser && (
                  <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                    You
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={roleColors[user.role]}
                  label={roleLabels[user.role]}
                />
                <StatusBadge
                  status={user.isActive ? 'green' : 'red'}
                  label={user.isActive ? 'Active' : 'Inactive'}
                />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-1 text-sm text-neutral-500">
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0" />
              <span>
                Last login: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
              </span>
            </div>
          </div>

          {/* Actions (not for self or super_admin) */}
          {!isCurrentUser && user.role !== 'super_admin' && (
            <>
              <Separator />
              <div className="flex flex-wrap items-center gap-2">
                {assignableRoles.length > 0 && user.isActive && (
                  <Select
                    value={user.role}
                    onValueChange={(value) =>
                      onChangeRole(user.id, value as Role)
                    }
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue placeholder="Change role" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {user.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-error-500 hover:bg-error-50 hover:text-error-600"
                    onClick={() => onDeactivate(user)}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Desktop Table Row ──

function UserTableRow({
  user,
  isCurrentUser,
  assignableRoles,
  onChangeRole,
  onDeactivate,
}: {
  user: User;
  isCurrentUser: boolean;
  assignableRoles: Role[];
  onChangeRole: (userId: string, role: Role) => void;
  onDeactivate: (user: User) => void;
}) {
  return (
    <tr className={`border-b ${!user.isActive ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">
            {user.name}
          </span>
          {isCurrentUser && (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              You
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          status={roleColors[user.role]}
          label={roleLabels[user.role]}
        />
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">
        {user.phone ?? '—'}
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          status={user.isActive ? 'green' : 'red'}
          label={user.isActive ? 'Active' : 'Inactive'}
        />
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500">
        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
      </td>
      <td className="px-4 py-3">
        {!isCurrentUser && user.role !== 'super_admin' && (
          <div className="flex items-center gap-2">
            {assignableRoles.length > 0 && user.isActive && (
              <Select
                value={user.role}
                onValueChange={(value) =>
                  onChangeRole(user.id, value as Role)
                }
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {user.isActive && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-error-500 hover:bg-error-50 hover:text-error-600"
                onClick={() => onDeactivate(user)}
              >
                Deactivate
              </Button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ──

export default function UserManagementPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { data: users, isLoading } = useUsers();
  const inviteUser = useInviteUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  const assignableRoles = getAssignableRoles(currentUser?.role ?? 'salesman');

  // ── Invite Form ──

  const {
    register,
    handleSubmit,
    reset: resetInviteForm,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: undefined,
    },
  });

  const selectedRole = watch('role');

  const onInvite = handleSubmit(async (values) => {
    inviteUser.mutate(
      {
        name: values.name,
        email: values.email || '',
        phone: values.phone,
        role: values.role,
      },
      {
        onSuccess: (res) => {
          const inviteLink = res?.data?.inviteLink;
          if (inviteLink) {
            navigator.clipboard?.writeText(inviteLink).then(
              () => toast.success('Invite link copied to clipboard'),
              () => toast.success(`Invite link: ${inviteLink}`),
            );
          }
          setInviteDialogOpen(false);
          resetInviteForm();
        },
      },
    );
  });

  const handleChangeRole = (userId: string, role: Role) => {
    updateUser.mutate({ id: userId, role });
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    deactivateUser.mutate(deactivateTarget.id, {
      onSuccess: () => setDeactivateTarget(null),
    });
  };

  return (
    <div>
      <PageHeader
        title="Team Management"
        showBack
        onBack={() => navigate('/settings')}
        action={{
          label: 'Invite Staff',
          onClick: () => setInviteDialogOpen(true),
          icon: UserPlus,
        }}
      />

      <div className="px-4 pb-8 desktop:px-6">
        {isLoading ? (
          <UserListSkeleton />
        ) : !users || users.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <Shield className="mx-auto mb-3 size-10 text-neutral-300" />
            <p className="text-sm">No team members yet.</p>
            <p className="text-xs text-neutral-400">
              Invite staff to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="space-y-3 desktop:hidden">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isCurrentUser={user.id === currentUser?.id}
                  assignableRoles={assignableRoles}
                  onChangeRole={handleChangeRole}
                  onDeactivate={setDeactivateTarget}
                />
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden desktop:block">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Last Login</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <UserTableRow
                          key={user.id}
                          user={user}
                          isCurrentUser={user.id === currentUser?.id}
                          assignableRoles={assignableRoles}
                          onChangeRole={handleChangeRole}
                          onDeactivate={setDeactivateTarget}
                        />
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>
              Send an invite to a new team member. They will receive a link to
              set up their account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Name *</Label>
              <Input
                id="invite-name"
                placeholder="Full name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-phone">Phone *</Label>
              <Input
                id="invite-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="email@example.com (optional)"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role *</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setValue('role', value as 'owner' | 'manager' | 'salesman', {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.role.message}
                </p>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 desktop:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInviteDialogOpen(false);
                  resetInviteForm();
                }}
                className="w-full desktop:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteUser.isPending}
                className="w-full desktop:w-auto"
              >
                {inviteUser.isPending ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Sheet */}
      <ConfirmSheet
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="Deactivate User"
        description={
          deactivateTarget
            ? `Are you sure you want to deactivate ${deactivateTarget.name}? They will no longer be able to log in or access the system.`
            : ''
        }
        confirmLabel="Deactivate"
        cancelLabel="Keep Active"
        onConfirm={handleDeactivate}
        variant="destructive"
      />
    </div>
  );
}
