import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/api/localDb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PoemCard from '@/components/poems/PoemCard';
import EmptyState from '@/components/poems/EmptyState';
import SearchBar from '@/components/poems/SearchBar';
import SortPicker from '@/components/poems/SortPicker';

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-created_date');

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

  const favorites = useMemo(() => {
    let filtered = poems.filter(p => p.is_favorite && !p.is_archived);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(q) || (p.plain_text || '').toLowerCase().includes(q)
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
  }, [poems, search, sort]);

  return (
    <div className="px-5 pt-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Favorites</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{favorites.length} poems</p>
      </motion.div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <div className="flex justify-end mb-5">
        <SortPicker value={sort} onChange={setSort} />
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Tap the heart icon on any poem to add it to your favorites."
          icon={Heart}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {favorites.map((poem) => (
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