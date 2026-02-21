import type { HTMLAttributes, ReactNode } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  className?: string;
};

export default function Badge({ children, className = '', ...props }: BadgeProps) {
  return (
    <span className={`inline-flex border px-2 py-0.5 text-xs font-medium ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
