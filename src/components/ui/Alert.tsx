import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const VARIANT_CONFIG: Record<AlertVariant, { icon: React.FC<{ className?: string }>; className: string }> = {
  info: { icon: Info, className: 'bg-blue-50 border-blue-200 text-blue-800' },
  success: { icon: CheckCircle, className: 'bg-green-50 border-green-200 text-green-800' },
  warning: { icon: AlertTriangle, className: 'bg-amber-50 border-amber-200 text-amber-800' },
  error: { icon: AlertCircle, className: 'bg-red-50 border-red-200 text-red-800' },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', config.className, className)} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 text-sm">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
