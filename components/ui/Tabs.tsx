import type { ReactNode } from 'react';

type TabItem<T extends string> = {
  id: T;
  label: string;
};

type TabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  items: Array<TabItem<T>>;
  className?: string;
};

export default function Tabs<T extends string>({ value, onChange, items, className = '' }: TabsProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`${active ? 'tabs-trigger tabs-trigger-active' : 'tabs-trigger'}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentButton({
  active,
  children,
  onClick,
  className = '',
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${active ? 'tabs-trigger tabs-trigger-active' : 'tabs-trigger'} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
