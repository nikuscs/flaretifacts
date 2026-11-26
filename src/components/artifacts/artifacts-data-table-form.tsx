'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { dataTableChoices, dataTableFields, dataTableFormRow, dataTableFormValues } from '@/utils/data-table.utils';
import type { ArtifactsBlocksDataTableColumn, ArtifactsBlocksDataTableFilter, ArtifactsBlocksDataTableRow } from '@/types/artifacts-blocks.types';
import type { ReactNode } from 'react';

interface ArtifactsDataTableFormProps {
  columns: ArtifactsBlocksDataTableColumn[];
  filters: ArtifactsBlocksDataTableFilter[];
  rows: ArtifactsBlocksDataTableRow[];
  row: ArtifactsBlocksDataTableRow | null;
  trigger: ReactNode;
  onSave: (row: ArtifactsBlocksDataTableRow) => void;
  onRemove?: () => void;
}

export function ArtifactsDataTableForm({ columns, filters, rows, row, trigger, onSave, onRemove }: ArtifactsDataTableFormProps) {
  const fields = dataTableFields(columns);
  const none = '\u0000';
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const filled = Object.values(values).some((value) => value.trim() !== '');
  const set = (key: string, value: string) => setValues({ ...values, [key]: value });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setValues(dataTableFormValues(fields, row));
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row ? 'Edit row' : 'Add a row'}</DialogTitle>
          <DialogDescription>Fill in what you know; every field is optional.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();

            if (filled) {
              onSave(dataTableFormRow(fields, values, row));
              setOpen(false);
            }
          }}
        >
          <div className="grid items-start gap-3 sm:grid-cols-3">
            {fields.map((field) => {
              const choices = dataTableChoices(field, filters, rows);
              const value = values[field.key] ?? '';

              return (
                <div
                  className={cn('min-w-0', (field.type === 'link' || field.type === 'avatar') && 'sm:col-span-3')}
                  key={field.key}
                >
                  <Field label={field.label}>
                    {(control) => (field.type === 'badge' && choices.length > 0 ? (
                      <Select
                        id={control.id}
                        label={field.label}
                        options={[{ value: none, label: 'None' }, ...choices.map((choice) => ({ value: choice, label: choice }))]}
                        placeholder={field.placeholder}
                        value={value === '' ? null : value}
                        onValueChange={(next) => set(field.key, next === none ? '' : next)}
                      />
                    ) : (
                      <>
                        <Input
                          {...control}
                          autoComplete="off"
                          inputMode={match(field.type).with('number', 'money', 'percent', 'progress', () => 'decimal' as const).otherwise(() => undefined)}
                          list={choices.length > 0 ? `${control.id}-choices` : undefined}
                          placeholder={field.placeholder ?? match(field.type).with('link', 'avatar', () => 'https://').otherwise(() => undefined)}
                          prefix={field.type === 'money' ? field.currency ?? ARTIFACTS_UI.dataTable.money : undefined}
                          type={match(field.type).with('date', () => 'date').with('link', 'avatar', () => 'url').otherwise(() => 'text')}
                          value={value}
                          onChange={(event) => set(field.key, event.target.value)}
                        />
                        {choices.length > 0 ? (
                          <datalist id={`${control.id}-choices`}>
                            {choices.map((choice) => (
                              <option
                                aria-label={choice}
                                key={choice}
                                value={choice}
                              />
                            ))}
                          </datalist>
                        ) : null}
                      </>
                    ))}
                  </Field>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            {onRemove ? (
              <Button
                className="sm:mr-auto"
                type="button"
                variant="destructive"
                onClick={() => {
                  onRemove();
                  setOpen(false);
                }}
              >
                Remove row
              </Button>
            ) : null}
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={!filled} type="submit">{row ? 'Save' : 'Add row'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
