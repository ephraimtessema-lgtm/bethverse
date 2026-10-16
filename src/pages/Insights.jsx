import React, { useMemo } from 'react';
import { db } from '@/api/localDb';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Type, Crown, Pencil, FolderOpen, Heart, Archive, Flame } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-2xl p-5 shadow-sm border border-border/50"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

export default function Insights() {
  const { data: poems = [] } = useQuery({
    queryKey: ['poems'],
    queryFn: () => db.entities.Poem.list('-created_date', 500),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list('name', 100),
  });

  const stats = useMemo(() => {
    const active = poems.filter(p => !p.is_archived);
    const totalWords = active.reduce((sum, p) => sum + (p.word_count || 0), 0);
    const longest = active.reduce((max, p) => (p.word_count || 0) > (max?.word_count || 0) ? p : max, null);
    const mostEdited = active.reduce((max, p) => (p.edit_count || 0) > (max?.edit_count || 0) ? p : max, null);
    const favoriteCount = active.filter(p => p.is_favorite).length;
    const archivedCount = poems.filter(p => p.is_archived).length;

    // Calculate writing streak (consecutive days with poems)
    const dates = [...new Set(active.map(p => new Date(p.created_date).toDateString()))];
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dates.includes(d.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalPoems: active.length,
      totalWords,
      longestPoem: longest?.title || '—',
      longestPoemWords: longest?.word_count || 0,
      mostEditedPoem: mostEdited?.title || '—',
      mostEditedCount: mostEdited?.edit_count || 0,
      collectionCount: collections.length,
      favoriteCount,
      archivedCount,
      writingStreak: streak,
    };
  }, [poems, collections]);

  const cards = [
    { icon: FileText, label: 'Total Poems', value: stats.totalPoems, color: 'bg-violet-500' },
    { icon: Type, label: 'Total Words', value: stats.totalWords.toLocaleString(), color: 'bg-blue-500' },
    { icon: Flame, label: 'Writing Streak', value: `${stats.writingStreak}d`, color: 'bg-orange-500' },
    { icon: Heart, label: 'Favorites', value: stats.favoriteCount, color: 'bg-rose-500' },
    { icon: FolderOpen, label: 'Collections', value: stats.collectionCount, color: 'bg-emerald-500' },
    { icon: Archive, label: 'Archived', value: stats.archivedCount, color: 'bg-slate-500' },
  ];

  return (
    <div className="px-5 pt-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Insights</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your poetry statistics</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 0.05} />
        ))}
      </div>

      {/* Highlights */}
      {stats.totalPoems > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="font-heading text-lg font-semibold">Highlights</h2>
          
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium">Longest Poem</span>
            </div>
            <p className="font-heading text-base font-semibold">{stats.longestPoem}</p>
            <p className="text-xs text-muted-foreground">{stats.longestPoemWords} words</p>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <Pencil className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Most Edited</span>
            </div>
            <p className="font-heading text-base font-semibold">{stats.mostEditedPoem}</p>
            <p className="text-xs text-muted-foreground">{stats.mostEditedCount} edits</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}