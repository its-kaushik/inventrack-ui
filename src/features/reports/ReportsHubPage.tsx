import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';

import { REPORT_CONFIGS, REPORT_GROUPS } from './reportConfigs';

// ── Helpers ──

function getReportsForGroup(groupKey: string) {
  return Object.values(REPORT_CONFIGS).filter((c) => c.group === groupKey);
}

// ── Component ──

export default function ReportsHubPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-20">
      <PageHeader title="Reports" />

      <div className="flex flex-col gap-8 px-4 desktop:px-6">
        {REPORT_GROUPS.map((group) => {
          const reports = getReportsForGroup(group.key);
          if (reports.length === 0) return null;

          const GroupIcon = group.icon;

          return (
            <section key={group.key}>
              {/* Group heading */}
              <div className="mb-3 flex items-center gap-2">
                <GroupIcon className="size-5 text-primary-600" aria-hidden="true" />
                <h2 className="text-base font-semibold text-neutral-900">
                  {group.label}
                </h2>
              </div>

              {/* Report cards grid */}
              <div
                className={cn(
                  'grid gap-3',
                  'grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3',
                )}
              >
                {reports.map((report) => (
                  <Card
                    key={report.key}
                    size="sm"
                    className="cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99]"
                    onClick={() => navigate(`/reports/${report.key}`)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/reports/${report.key}`);
                      }
                    }}
                  >
                    <CardContent className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {report.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">
                          {report.description}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
