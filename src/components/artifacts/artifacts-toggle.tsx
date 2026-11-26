'use client';

import { useBoundProp } from '@json-render/react';
import { useId } from 'react';
import { ArtifactsRowText } from '@/components/artifacts/artifacts-row-text';
import { Switch } from '@/components/ui/switch';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';

interface ArtifactsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  binding?: string;
}

export function ArtifactsToggle({ label, description, checked, binding }: ArtifactsToggleProps) {
  const id = useId();
  const [bound = false, setBound] = useBoundProp(checked, binding);

  return (
    <div className={ARTIFACTS_UI.list}>
      <div className={ARTIFACTS_UI.row}>
        <ArtifactsRowText description={description}>
          <label className="cursor-pointer" htmlFor={id}>{label}</label>
        </ArtifactsRowText>
        <Switch
          checked={bound}
          id={id}
          onCheckedChange={setBound}
        />
      </div>
    </div>
  );
}
