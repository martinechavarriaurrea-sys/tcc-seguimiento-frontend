import { type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconClassName?: string;
  isLoading?: boolean;
  subtitle?: string;
  alert?: boolean;
}

export function KPICard({ title, value, icon: Icon, iconClassName, isLoading, subtitle, alert }: KPICardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-5 shadow-sm',
        alert ? 'border-amber-200' : 'border-gray-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          {isLoading ? (
            <Spinner size="sm" className="mt-2 text-gray-300" />
          ) : (
            <p className={cn('mt-1 text-2xl font-bold', alert && Number(value) > 0 ? 'text-amber-600' : 'text-gray-900')}>
              {value}
            </p>
          )}
          {subtitle && !isLoading && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', iconClassName ?? 'bg-blue-50 text-blue-600')}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
