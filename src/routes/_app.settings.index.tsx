import { createFileRoute, Link } from '@tanstack/react-router'
import { Store, Users, Tag, Sliders, FileText } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export const Route = createFileRoute('/_app/settings/')({
  component: SettingsHubPage,
})

const settingsCards = [
  {
    title: 'Store Settings',
    description: 'Manage your store profile, GST configuration, and invoice settings.',
    icon: Store,
    to: '/settings/store' as const,
  },
  {
    title: 'User Management',
    description: 'Add, edit, and manage staff accounts and their roles.',
    icon: Users,
    to: '/settings/users' as const,
  },
  {
    title: 'Categories & Sizes',
    description: 'Configure product categories, size systems, and brands.',
    icon: Tag,
    to: '/settings/categories' as const,
  },
  {
    title: 'Thresholds',
    description: 'Configure stock, aging, and discount limits.',
    icon: Sliders,
    to: '/settings/thresholds' as const,
  },
  {
    title: 'Templates',
    description: 'Customize receipt and label templates.',
    icon: FileText,
    to: '/settings/templates' as const,
  },
]

function SettingsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your store configuration and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => (
          <Link key={card.to} to={card.to} className="group">
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <card.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {card.title}
                    </CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
