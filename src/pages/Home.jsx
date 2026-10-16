import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/api/localDb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Archive, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import PoemCard from '@/components/poems/PoemCard';
import EmptyState from '@/components/poems/EmptyState';
import SearchBar from '@/components/poems/SearchBar';
import SortPicker from '@/components/poems/SortPicker';
import SkeletonCard from '@/components/poems/SkeletonCard';
import OcrExtractModal from '@/components/ocr/OcrExtractModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-created_date');
  const [tab, setTab] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showOcr, setShowOcr] = useState(false);

  const { data: poems = [], isLoading } = useQuery({
    queryKey: ['poems'],
    queryFn: () => db.entities.Poem.list('-created_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Poem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poems'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Poem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poems'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Poem.create(data),
    onSuccess: (poem) => {
      queryClient.invalidateQueries({ queryKey: ['poems'] });
      navigate(`/editor/${poem.id}`);
    },
  });

  const filteredPoems = useMemo(() => {
    let filtered = poems.filter(p => tab === 'archived' ? p.is_archived : !p.is_archived);
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.plain_text || '').toLowerCase().includes(q) ||
        (p.collection || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case '-created_date': return new Date(b.created_date) - new Date(a.created_date);
        case 'created_date': return new Date(a.created_date) - new Date(b.created_date);
        case 'title': return (a.title || '').localeCompare(b.title || '');
        case '-updated_date': return new Date(b.updated_date) - new Date(a.updated_date);
        default: return 0;
      }
    });

    return filtered;
  }, [poems, search, sort, tab]);

  const handleFavorite = (poem) => {
    updateMutation.mutate({ id: poem.id, data: { is_favorite: !poem.is_favorite } });
  };

  const handleArchive = (poem) => {
    updateMutation.mutate({ id: poem.id, data: { is_archived: !poem.is_archived } });
  };

  const handleDuplicate = (poem) => {
    createMutation.mutate({
      title: `${poem.title} (copy)`,
      content: poem.content,
      plain_text: poem.plain_text,
      collection: poem.collection,
      word_count: poem.word_count,
      char_count: poem.char_count,
    });
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleNewPoem = () => {
    createMutation.mutate({ title: '', content: '', plain_text: '' });
  };

  // Used by AppShell's floating "+" button.
  const handleFabClick = () => {
    const el = document.querySelector('[data-bethverse-new-poem]');
    if (el) el.click();
    else handleNewPoem();
  };

  const activeCount = poems.filter(p => !p.is_archived).length;
  const archivedCount = poems.filter(p => p.is_archived).length;

  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">BethVerse</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your offline poetry vault</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowOcr(true)}
            size="icon"
            variant="outline"
            className="rounded-full w-10 h-10"
            title="Extract poem from image"
          >
            <ScanText className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Tabs + Sort */}
      <div className="flex items-center justify-between mb-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/50 rounded-full h-9 p-1">
            <TabsTrigger value="active" className="rounded-full text-xs px-4 data-[state=active]:shadow-sm">
              Poems{activeCount > 0 ? ` (${activeCount})` : ''}
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-full text-xs px-4 data-[state=active]:shadow-sm">
              <Archive className="w-3.5 h-3.5 mr-1" />
              {archivedCount > 0 ? archivedCount : 'Archive'}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <SortPicker value={sort} onChange={setSort} />
      </div>

      {/* Poem List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredPoems.length === 0 ? (
        <EmptyState
          title={search ? 'No poems found' : tab === 'archived' ? 'No archived poems' : 'Begin your journey'}
          description={search ? 'Try a different search term' : tab === 'archived' ? 'Archived poems will appear here' : 'Tap the + button to write your first poem and start your personal poetry collection.'}
          actionLabel={!search && tab !== 'archived' ? 'Write a Poem' : undefined}
          onAction={!search && tab !== 'archived' ? handleNewPoem : undefined}
        />
      ) : (
        <div className="space-y-3 pb-4">
          <AnimatePresence mode="popLayout">
            {filteredPoems.map((poem) => (
              <PoemCard
                key={poem.id}
                poem={poem}
                onFavorite={handleFavorite}
                onArchive={handleArchive}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
                onClick={(p) => navigate(`/editor/${p.id}`)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* OCR Modal */}
      <OcrExtractModal
        open={showOcr}
        onClose={() => setShowOcr(false)}
        defaultLanguage={localStorage.getItem('bethverse_ocr_lang') || 'auto'}
        defaultQuality={localStorage.getItem('bethverse_ocr_quality') || 'balanced'}
        onExtracted={(text) => {
          createMutation.mutate({
            title: 'Extracted Poem',
            content: text.split('\n').map(l => `<p>${l || '<br>'}</p>`).join(''),
            plain_text: text,
            word_count: text.split(/\s+/).filter(Boolean).length,
          });
        }}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete poem?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title || 'Untitled'}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-full bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}