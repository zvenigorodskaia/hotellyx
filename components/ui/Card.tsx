import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'article' | 'div';
  children: ReactNode;
  className?: string;
};

export default function Card({ as = 'section', children, className = '', ...props }: CardProps) {
  const Component = as;
  return (
    <Component className={`card-base ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
