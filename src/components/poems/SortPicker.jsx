import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

const sortOptions = [
  { value: '-created_date', label: 'Newest' },
  { value: 'created_date', label: 'Oldest' },
  { value: 'title', label: 'A → Z' },
  { value: '-updated_date', label: 'Recently Edited' },
];

export default function SortPicker({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto gap-2 border-0 bg-muted/50 rounded-full px-3 h-9 text-xs">
        <ArrowUpDown className="w-3.5 h-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}