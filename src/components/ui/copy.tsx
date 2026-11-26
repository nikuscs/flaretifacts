'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToastStack } from '@/components/ui/toast-stack';
import Check from '~icons/lucide/check';
import CopyIcon from '~icons/lucide/copy';

interface CopyProps {
  value: string;
  label: string;
}

interface CopyButtonProps extends CopyProps {
  className?: string;
}

export function useCopy(label: string) {
  const { toast } = useToastStack();
  const [copied, setCopied] = useState(false);

  const copy = (value: string) => navigator.clipboard.writeText(value).then(
    () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({
        type: 'success',
        title: `Copied the ${label}`,
        description: value.length <= 120 && !value.includes('\n') ? value : undefined,
      });
    },
    () => toast({ type: 'error', title: `Couldn't copy the ${label}` }),
  );

  return { copied, copy };
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const { copied, copy } = useCopy(label);

  return (
    <Button
      aria-label={copied ? `Copied the ${label}` : `Copy the ${label} ${value}`}
      className={cn('-my-1 shrink-0', className)}
      size="icon-xs"
      title={copied ? 'Copied' : `Copy ${label}`}
      variant="ghost"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void copy(value);
      }}
    >
      {copied ? <Check /> : <CopyIcon />}
    </Button>
  );
}

export function CopyMenuItem({ value, label }: CopyProps) {
  const { copy } = useCopy(label);

  return (
    <DropdownMenuItem onSelect={() => void copy(value)}>
      {`Copy ${label}`}
    </DropdownMenuItem>
  );
}
