import React from 'react';
import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Feather }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-9 h-9 text-primary" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-full px-6">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}