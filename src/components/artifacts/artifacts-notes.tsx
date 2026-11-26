'use client';

import { useBoundProp } from '@json-render/react';
import { useId } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';

interface ArtifactsNotesProps {
  value: string;
  label?: string;
  placeholder?: string;
  binding?: string;
}

export function ArtifactsNotes({ value, label, placeholder, binding }: ArtifactsNotesProps) {
  const id = useId();
  const [bound = '', setBound] = useBoundProp(value, binding);

  return (
    <div className="flex flex-col gap-2">
      {label ? <label className={ARTIFACTS_UI.label} htmlFor={id}>{label}</label> : null}
      <Textarea
        aria-label={label ? undefined : placeholder ?? 'Notes'}
        defaultValue={bound}
        id={id}
        key={bound}
        placeholder={placeholder}
        onBlur={(event) => event.target.value !== bound && setBound(event.target.value)}
      />
    </div>
  );
}
