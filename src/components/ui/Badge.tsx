import { cn } from '@/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  dotClassName?: string;
}

export function Badge({ children, className, dot, dotClassName }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName ?? 'bg-current')} />
      )}
      {children}
    </span>
  );
}
