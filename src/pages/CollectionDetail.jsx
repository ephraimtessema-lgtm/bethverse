import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/api/localDb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import PoemCard from '@/components/poems/PoemCard';
import EmptyState from '@/components/poems/EmptyState';
import SearchBar from '@/components/poems/SearchBar';
import SortPicker from '@/components/poems/SortPicker';

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-created_date');

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list('name', 100),
  });

  const collection = collections.find(c => c.id === id);

  const { data: poems = [] } = useQuery({
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
    let filtered = poems.filter(p => p.collection === collection?.name && !p.is_archived);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.plain_text || '').toLowerCase().includes(q)
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
  }, [poems, collection, search, sort]);

  return (
    <div className="px-5 pt-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/collections')} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">{collection?.name || 'Collection'}</h1>
          <p className="text-xs text-muted-foreground">{filteredPoems.length} poems</p>
        </div>
        <Button
          onClick={() => createMutation.mutate({ title: '', content: '', collection: collection?.name })}
          size="icon"
          className="rounded-full w-10 h-10 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </motion.div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <div className="flex justify-end mb-4">
        <SortPicker value={sort} onChange={setSort} />
      </div>

      {filteredPoems.length === 0 ? (
        <EmptyState
          title="No poems here"
          description="Start writing or move poems into this collection."
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredPoems.map((poem) => (
              <PoemCard
                key={poem.id}
                poem={poem}
                onFavorite={(p) => updateMutation.mutate({ id: p.id, data: { is_favorite: !p.is_favorite } })}
                onArchive={(p) => updateMutation.mutate({ id: p.id, data: { is_archived: !p.is_archived } })}
                onDuplicate={(p) => createMutation.mutate({ title: `${p.title} (copy)`, content: p.content, plain_text: p.plain_text, collection: p.collection, word_count: p.word_count })}
                onDelete={(p) => deleteMutation.mutate(p.id)}
                onClick={(p) => navigate(`/editor/${p.id}`)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}