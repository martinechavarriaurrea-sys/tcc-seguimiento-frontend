import { PackageSearch } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
        {icon ?? <PackageSearch className="h-8 w-8" />}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
