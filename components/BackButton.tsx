'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

type BackButtonProps = {
  className?: string;
};

export default function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => router.back()}
      className={className ?? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm'}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back
    </Button>
  );
}
