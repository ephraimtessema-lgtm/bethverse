import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/api/localDb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '@/components/poems/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

const COLLECTION_COLORS = [
  'bg-violet-500', 'bg-rose-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500',
];

export default function Collections() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list('name', 100),
  });

  const { data: poems = [] } = useQuery({
    queryKey: ['poems'],
    queryFn: () => db.entities.Poem.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Collection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Collection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Collection.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCollection(null);
    setName('');
    setSelectedColor(0);
  };

  const openEdit = (col) => {
    setEditingCollection(col);
    setName(col.name);
    setSelectedColor(COLLECTION_COLORS.indexOf(col.color) >= 0 ? COLLECTION_COLORS.indexOf(col.color) : 0);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = { name, color: COLLECTION_COLORS[selectedColor] };
    if (editingCollection) {
      updateMutation.mutate({ id: editingCollection.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getPoemCount = (collectionName) => poems.filter(p => p.collection === collectionName && !p.is_archived).length;

  return (
    <div className="px-5 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Collections</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{collections.length} collections</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="icon"
          className="rounded-full w-11 h-11 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </motion.div>

      {collections.length === 0 && !isLoading ? (
        <EmptyState
          title="No collections yet"
          description="Organize your poems by creating collections like Love, Nature, Faith, and more."
          actionLabel="Create Collection"
          onAction={() => setDialogOpen(true)}
          icon={FolderOpen}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {collections.map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/collection/${col.id}`)}
              >
                <div className={`w-12 h-12 rounded-xl ${col.color || 'bg-primary'} flex items-center justify-center shrink-0`}>
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-base font-semibold truncate">{col.name}</h3>
                  <p className="text-xs text-muted-foreground">{getPoemCount(col.name)} poems</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(col); }}
                    className="p-2 rounded-full hover:bg-muted"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(col); }}
                    className="p-2 rounded-full hover:bg-muted"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingCollection ? 'Edit' : 'New'} Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection name"
              className="rounded-xl"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLLECTION_COLORS.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(i)}
                    className={`w-8 h-8 rounded-full ${c} transition-transform ${selectedColor === i ? 'scale-125 ring-2 ring-offset-2 ring-primary' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={!name.trim()} className="rounded-full w-full">
              {editingCollection ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be deleted. Poems in this collection won't be removed.
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