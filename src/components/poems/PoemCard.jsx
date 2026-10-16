import React from 'react';
import { Heart, MoreVertical, Archive, Copy, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PoemCard({
  poem,
  onFavorite,
  onArchive,
  onDuplicate,
  onDelete,
  onClick,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <div
        onClick={() => onClick(poem)}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-semibold text-foreground leading-tight line-clamp-2">
              {poem.title || 'Untitled'}
            </h3>
            <div className="mt-1 text-xs text-muted-foreground">
              {format(new Date(poem.created_date), 'MMM d, yyyy')}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(poem); }}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label={poem.is_favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Heart
                className={cn('w-4 h-4 transition-colors', poem.is_favorite ? 'text-primary fill-primary' : 'text-muted-foreground')}
              />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="More actions">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onClick(poem)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(poem)}>
                  <Copy className="w-4 h-4 mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(poem)}>
                  <Archive className="w-4 h-4 mr-2" /> {poem.is_archived ? 'Restore' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(poem)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}