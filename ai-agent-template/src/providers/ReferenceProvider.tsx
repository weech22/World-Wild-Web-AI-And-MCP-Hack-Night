import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { MOCK_REFERENCES } from "@/constants/mockData";
import { useBackend } from "@/providers/BackendProvider";

interface ReferenceItem {
  id: string;
  title: string;
  content: string;
  details: string;
  type: "document" | "link" | "note";
  createdAt: Date;
}

interface ReferenceContextType {
  referenceItems: ReferenceItem[];
  selectedItem: ReferenceItem | null;
  isDrawerOpen: boolean;
  addReference: (reference: Omit<ReferenceItem, "id" | "createdAt">) => void;
  updateReference: (id: string, updates: Partial<ReferenceItem>) => void;
  deleteReference: (id: string) => void;
  selectReference: (item: ReferenceItem | null) => void;
  openDrawer: (item: ReferenceItem) => void;
  closeDrawer: () => void;
}

const ReferenceContext = createContext<ReferenceContextType | undefined>(undefined);

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>(MOCK_REFERENCES);
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { notes: backendNotes, isConnected } = useBackend();

  // Use backend notes when available, fallback to mock data
  useEffect(() => {
    if (isConnected && backendNotes && backendNotes.length > 0) {
      // Transform backend notes to match our ReferenceItem interface
      const transformedNotes = backendNotes.map((note: any) => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content || "",
        details: note.content || "",
        type: "note" as const,
        createdAt: new Date(note.created_at)
      }));
      setReferenceItems(transformedNotes);
    }
  }, [backendNotes, isConnected]);

  console.log('ReferenceProvider rendered:', { 
    referenceItemsCount: referenceItems.length, 
    isDrawerOpen, 
    selectedItem: selectedItem?.title || 'none' 
  });

  const addReference = async (referenceData: Omit<ReferenceItem, "id" | "createdAt">) => {
    if (isConnected) {
      try {
        const response = await fetch('http://localhost:3001/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: referenceData.title,
            content: referenceData.content
          })
        });
        if (!response.ok) throw new Error('Failed to create note');
      } catch (error) {
        console.error('Error creating note:', error);
      }
    } else {
      // Fallback to local state
      const newReference: ReferenceItem = {
        ...referenceData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      setReferenceItems(prev => [...prev, newReference]);
    }
  };

  const updateReference = async (id: string, updates: Partial<ReferenceItem>) => {
    if (isConnected) {
      try {
        const response = await fetch(`http://localhost:3001/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updates.title,
            content: updates.content
          })
        });
        if (!response.ok) throw new Error('Failed to update note');
      } catch (error) {
        console.error('Error updating note:', error);
      }
    } else {
      // Fallback to local state
      setReferenceItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    }
  };

  const deleteReference = async (id: string) => {
    if (isConnected) {
      try {
        const response = await fetch(`http://localhost:3001/api/notes/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete note');
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    } else {
      // Fallback to local state
      setReferenceItems(prev => prev.filter(item => item.id !== id));
    }
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const selectReference = (item: ReferenceItem | null) => {
    setSelectedItem(item);
  };

  const openDrawer = (item: ReferenceItem) => {
    console.log('openDrawer called with item:', item.title);
    setSelectedItem(item);
    setIsDrawerOpen(true);
    console.log('State should be updated to:', { isDrawerOpen: true, selectedItem: item.title });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedItem(null);
  };

  const value: ReferenceContextType = {
    referenceItems,
    selectedItem,
    isDrawerOpen,
    addReference,
    updateReference,
    deleteReference,
    selectReference,
    openDrawer,
    closeDrawer,
  };

  return (
    <ReferenceContext.Provider value={value}>
      {children}
    </ReferenceContext.Provider>
  );
}

export function useReference() {
  const context = useContext(ReferenceContext);
  if (!context) {
    console.error("useReference called outside of ReferenceProvider!");
    throw new Error("useReference must be used within a ReferenceProvider");
  }
  console.log('useReference called, context:', {
    referenceItemsCount: context.referenceItems.length,
    isDrawerOpen: context.isDrawerOpen,
    selectedItem: context.selectedItem?.title || 'none'
  });
  return context;
}