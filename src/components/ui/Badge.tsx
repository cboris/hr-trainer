import { HTMLAttributes, forwardRef } from 'react';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-surface-100 text-surface-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';