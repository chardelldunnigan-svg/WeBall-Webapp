// Browser: the built-in date/time input.
import React from 'react';
import { Colors, Radius } from '@/constants/theme';

export interface StartTimePickerProps {
  value: Date;
  onChange: (d: Date) => void;
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StartTimePicker({ value, onChange }: StartTimePickerProps) {
  return (
    <input
      type="datetime-local"
      aria-label="Start date and time"
      value={toLocalInput(value)}
      min={toLocalInput(new Date())}
      step={900}
      onChange={(e) => {
        const d = new Date(e.target.value);
        if (!Number.isNaN(d.getTime())) onChange(d);
      }}
      style={{
        alignSelf: 'flex-start',
        backgroundColor: Colors.surface,
        border: `1px solid ${Colors.border}`,
        borderRadius: Radius.md,
        color: Colors.ink,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: 15,
        padding: '10px 12px',
      }}
    />
  );
}
