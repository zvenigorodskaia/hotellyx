import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

function getVariantClassName(variant: ButtonVariant): string {
  if (variant === 'outline') {
    return 'btn-secondary';
  }

  if (variant === 'ghost') {
    return 'inline-flex items-center justify-center rounded-none border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]';
  }

  return 'btn-primary';
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button className={`${getVariantClassName(variant)} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
