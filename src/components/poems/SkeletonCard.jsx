import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full rounded-lg mb-1.5" />
      <Skeleton className="h-4 w-5/6 rounded-lg mb-1.5" />
      <Skeleton className="h-4 w-2/3 rounded-lg mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}