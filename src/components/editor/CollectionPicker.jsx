import React from 'react';
import { db } from '@/api/localDb';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen } from 'lucide-react';

export default function CollectionPicker({ value, onChange }) {
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list('name', 100),
  });

  return (
    <Select value={value || '_none'} onValueChange={(v) => onChange(v === '_none' ? '' : v)}>
      <SelectTrigger className="w-auto gap-2 border-0 bg-muted/50 rounded-full px-3 h-8 text-xs">
        <FolderOpen className="w-3.5 h-3.5" />
        <SelectValue placeholder="No collection" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">No collection</SelectItem>
        {collections.map((col) => (
          <SelectItem key={col.id} value={col.name}>{col.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}