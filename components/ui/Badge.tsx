import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex border px-2 py-0.5 text-xs font-medium ${className}`.trim()}>
      {children}
    </span>
  );
}
