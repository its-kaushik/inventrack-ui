import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { UserPlus, Loader2 } from 'lucide-react'
import { createCustomer } from '@/api/customers.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface CustomerQuickAddProps {
  initialPhone?: string
  onCreated: (customerId: string, customerName: string) => void
  onCancel: () => void
}

export function CustomerQuickAdd({
  initialPhone = '',
  onCreated,
  onCancel,
}: CustomerQuickAddProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(initialPhone)

  const mutation = useMutation({
    mutationFn: () =>
      createCustomer({ name: name.trim(), phone: phone.trim() }),
    onSuccess: (response) => {
      toast.success('Customer created')
      onCreated(response.data.id, response.data.name)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create customer')
    },
  })

  const canSubmit = name.trim().length >= 2 && phone.trim().length >= 10

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserPlus className="size-4" />
        New Customer
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
            placeholder="10-digit phone"
            inputMode="tel"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
          Create
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
