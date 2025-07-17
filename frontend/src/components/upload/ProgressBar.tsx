import { cn } from '../../lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  animated?: boolean;
}

export function ProgressBar({
  progress,
  className,
  showPercentage = false,
  color = 'blue',
  animated = true
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className={cn('relative w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full transition-all duration-300 ease-out',
          colorClasses[color],
          animated && 'transition-transform'
        )}
        style={{ width: `${clampedProgress}%` }}
      />
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
}