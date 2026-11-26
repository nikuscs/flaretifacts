'use client';

import { useBoundProp } from '@json-render/react';
import { useId } from 'react';
import { Select } from '@/components/ui/select';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';

interface ArtifactsSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  binding?: string;
}

export function ArtifactsSelect({ label, options, value, binding }: ArtifactsSelectProps) {
  const id = useId();
  const [bound, setBound] = useBoundProp(value, binding);

  return (
    <div className="flex flex-col gap-2">
      <label className={ARTIFACTS_UI.label} htmlFor={id}>{label}</label>
      <Select
        id={id}
        label={label}
        options={options}
        value={bound ?? null}
        onValueChange={setBound}
      />
    </div>
  );
}
