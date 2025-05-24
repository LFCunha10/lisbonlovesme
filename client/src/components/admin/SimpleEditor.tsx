import React from 'react';
import { cn } from '@/lib/utils';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SimpleEditor({ value, onChange, className }: SimpleEditorProps) {
  // Use a simple textarea instead of contentEditable
  return (
    <textarea
      className={cn(
        "w-full min-h-[250px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}