import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ParkingItem {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: Date;
}

export function useParkingLot() {
  const { user } = useAuth();
  const [items, setItems] = useState<ParkingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items from database
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const loadItems = async () => {
      const { data, error } = await supabase
        .from('parking_lot_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading parking lot items:', error);
      } else if (data) {
        setItems(data.map(item => ({
          id: item.id,
          content: item.content,
          isCompleted: item.is_completed,
          createdAt: new Date(item.created_at)
        })));
      }
      setLoading(false);
    };

    loadItems();
  }, [user]);

  const addItem = async (content: string) => {
    if (!user) {
      toast.error('Please sign in to add items');
      return;
    }

    const tempId = Date.now().toString();
    const newItem: ParkingItem = {
      id: tempId,
      content,
      isCompleted: false,
      createdAt: new Date()
    };

    // Optimistically add
    setItems(prev => [newItem, ...prev]);

    const { data, error } = await supabase
      .from('parking_lot_items')
      .insert({
        user_id: user.id,
        content,
        is_completed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      setItems(prev => prev.filter(i => i.id !== tempId));
      toast.error('Failed to add item');
    } else if (data) {
      setItems(prev =>
        prev.map(i => i.id === tempId ? { ...i, id: data.id } : i)
      );
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Optimistically update
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, isCompleted: !i.isCompleted } : i)
    );

    const { error } = await supabase
      .from('parking_lot_items')
      .update({ is_completed: !item.isCompleted })
      .eq('id', id);

    if (error) {
      console.error('Error toggling item:', error);
      // Revert on error
      setItems(prev =>
        prev.map(i => i.id === id ? { ...i, isCompleted: item.isCompleted } : i)
      );
    }
  };

  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    
    // Optimistically remove
    setItems(prev => prev.filter(i => i.id !== id));

    const { error } = await supabase
      .from('parking_lot_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      // Revert on error
      if (item) {
        setItems(prev => [...prev, item]);
      }
    }
  };

  return { items, loading, addItem, toggleItem, deleteItem };
}
