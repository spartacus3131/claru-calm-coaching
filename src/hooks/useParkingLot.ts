import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { backend } from '@/backend';
import type { ParkingItem } from '@/types/parkingLot';

export function useParkingLot() {
  const { user } = useAuth();
  const [items, setItems] = useState<ParkingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items from database if logged in
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const loadItems = async () => {
      try {
        const data = await backend.parkingLot.list(user.id);
        setItems(
          data.map((item) => ({
            id: item.id,
            content: item.content,
            isCompleted: item.is_completed,
            createdAt: new Date(item.created_at),
          }))
        );
      } catch (e) {
        console.error('Error loading parking lot items:', e);
      }
      setLoading(false);
    };

    loadItems();
  }, [user]);

  const addItem = async (content: string): Promise<boolean> => {
    if (!user) {
      toast.error('Create an account to save your ideas', {
        action: {
          label: 'Sign up',
          onClick: () => window.location.href = '/auth'
        }
      });
      return false;
    }

    const tempId = Date.now().toString();
    const newItem: ParkingItem = {
      id: tempId,
      content,
      isCompleted: false,
      createdAt: new Date()
    };

    setItems(prev => [newItem, ...prev]);

    try {
      const created = await backend.parkingLot.create(user.id, content);
      setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, id: created.id } : i)));
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      setItems(prev => prev.filter(i => i.id !== tempId));
      toast.error('Failed to add item');
      return false;
    }
  };

  const toggleItem = async (id: string) => {
    if (!user) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;

    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, isCompleted: !i.isCompleted } : i)
    );

    try {
      await backend.parkingLot.setCompleted(user.id, id, !item.isCompleted);
    } catch (error) {
      console.error('Error toggling item:', error);
      setItems(prev =>
        prev.map(i => i.id === id ? { ...i, isCompleted: item.isCompleted } : i)
      );
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    
    const item = items.find(i => i.id === id);
    
    setItems(prev => prev.filter(i => i.id !== id));

    try {
      await backend.parkingLot.remove(user.id, id);
    } catch (error) {
      console.error('Error deleting item:', error);
      if (item) {
        setItems(prev => [...prev, item]);
      }
    }
  };

  return { items, loading, addItem, toggleItem, deleteItem, isAuthenticated: !!user };
}
