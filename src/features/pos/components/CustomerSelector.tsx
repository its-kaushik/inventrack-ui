'use client';

import { useState, useCallback } from 'react';
import { User, Phone, Search, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PhoneInput } from '@/components/shared';
import { QuickAddCustomerSheet } from '@/features/customers/QuickAddCustomerSheet';

import { useCustomers } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';
import type { CartCustomer } from '@/stores/cart.store';
import type { Customer } from '@/types/models';

// ── Props ──

interface CustomerSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelected: (customer: CartCustomer) => void;
}

export function CustomerSelector({
  open,
  onOpenChange,
  onSelected,
}: CustomerSelectorProps) {
  const [phone, setPhone] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const debouncedPhone = useDebounce(phone, 300);

  const { data, isLoading } = useCustomers(
    debouncedPhone.length >= 3 ? { search: debouncedPhone } : undefined,
  );

  const customers = data?.data ?? [];
  const hasSearched = debouncedPhone.length >= 3;
  const noResults = hasSearched && !isLoading && customers.length === 0;

  const handleSelect = useCallback(
    (customer: Customer) => {
      onSelected({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        outstandingBalance: parseFloat(customer.outstandingBalance) || 0,
      });
      setPhone('');
      onOpenChange(false);
    },
    [onSelected, onOpenChange],
  );

  const handleQuickAddCreated = useCallback(
    (customer: Customer) => {
      handleSelect(customer);
    },
    [handleSelect],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPhone('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh]">
          <SheetHeader>
            <SheetTitle>Select Customer</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 p-4 pt-0">
            {/* Phone search input */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="size-4" />
                Search by phone
              </div>
              <PhoneInput
                value={phone}
                onChange={setPhone}
              />
            </div>

            {/* Results */}
            <div className="flex flex-col gap-1">
              {!hasSearched && (
                <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                  <Search className="size-8" />
                  <p className="text-sm">Enter at least 3 digits to search</p>
                </div>
              )}

              {hasSearched && isLoading && (
                <div className="py-8 text-center text-sm text-neutral-400">
                  Searching...
                </div>
              )}

              {noResults && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-neutral-500">Customer not found</p>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setQuickAddOpen(true)}
                  >
                    <Plus className="size-4" />
                    Add New Customer
                  </Button>
                </div>
              )}

              {customers.length > 0 && (
                <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto" role="listbox">
                  {customers.map((customer) => (
                    <li key={customer.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-3',
                          'bg-neutral-50 transition-colors',
                          'hover:bg-neutral-100 active:bg-neutral-200',
                        )}
                        onClick={() => handleSelect(customer)}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="size-5" />
                        </div>
                        <div className="flex flex-1 flex-col items-start text-left">
                          <span className="text-sm font-medium text-foreground">
                            {customer.name}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {customer.phone}
                          </span>
                        </div>
                        {parseFloat(customer.outstandingBalance) > 0 && (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-neutral-400">Khata</span>
                            <span className="text-sm font-medium text-error-600">
                              {formatINR(customer.outstandingBalance)}
                            </span>
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick-add sub-sheet */}
      <QuickAddCustomerSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onCreated={handleQuickAddCreated}
      />
    </>
  );
}
