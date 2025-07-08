import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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
  isCreateMode: boolean;
  addReference: (reference: Omit<ReferenceItem, "id" | "createdAt">) => void;
  updateReference: (id: string, updates: Partial<ReferenceItem>) => void;
  deleteReference: (id: string) => void;
  selectReference: (item: ReferenceItem | null) => void;
  openDrawer: (item: ReferenceItem) => void;
  openCreateDrawer: () => void;
  closeDrawer: () => void;
}

const ReferenceContext = createContext<ReferenceContextType | undefined>(undefined);

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const { notes: backendNotes, isApiAvailable } = useBackend();

  // Transform backend notes to match our ReferenceItem interface
  useEffect(() => {
    if (backendNotes && backendNotes.length >= 0) {
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
  }, [backendNotes]);

  console.log('ReferenceProvider rendered:', { 
    referenceItemsCount: referenceItems.length, 
    isDrawerOpen, 
    selectedItem: selectedItem?.title || 'none' 
  });

  const addReference = async (referenceData: Omit<ReferenceItem, "id" | "createdAt">) => {
    console.log('addReference called:', { referenceData, isApiAvailable });
    
    // Always try the API call first, regardless of health check status
    try {
      console.log('Attempting POST to /api/notes...');
      const response = await fetch('http://localhost:3001/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: referenceData.title,
          content: referenceData.content
        })
      });
      
      if (response.ok) {
        const newNote = await response.json();
        console.log('API call successful:', newNote);
        // Note will be updated via Socket.IO or we can update local state
        closeDrawer();
        return;
      } else {
        console.error('API call failed with status:', response.status);
        throw new Error(`Failed to create note: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating note via API:', error);
      console.log('Falling back to local state...');
      
      // Fallback to local state
      const newReference: ReferenceItem = {
        ...referenceData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      setReferenceItems(prev => [...prev, newReference]);
      closeDrawer();
    }
  };

  const updateReference = async (id: string, updates: Partial<ReferenceItem>) => {
    if (isApiAvailable) {
      try {
        const response = await fetch(`http://localhost:3001/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updates.title,
            content: updates.details || updates.content
          })
        });
        if (!response.ok) throw new Error('Failed to update note');
      } catch (error) {
        console.error('Error updating note:', error);
        // Still update local state as fallback
        setReferenceItems(prev => prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ));
      }
    } else {
      // Fallback to local state
      setReferenceItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    }
  };

  const deleteReference = async (id: string) => {
    console.log('🗑️ deleteReference called:', { id, isApiAvailable });
    
    // Always try the API call first, regardless of health check status
    try {
      console.log('Attempting DELETE to /api/notes/' + id);
      const response = await fetch(`http://localhost:3001/api/notes/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Delete API call successful');
        // Note will be updated via Socket.IO or we can update local state
        if (selectedItem?.id === id) {
          setSelectedItem(null);
          closeDrawer();
        }
        return;
      } else {
        console.error('❌ Delete API call failed with status:', response.status);
        throw new Error(`Failed to delete note: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting note via API:', error);
      console.log('Falling back to local state...');
      
      // Fallback to local state
      setReferenceItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
        closeDrawer();
      }
    }
  };

  const selectReference = (item: ReferenceItem | null) => {
    setSelectedItem(item);
  };

  const openDrawer = (item: ReferenceItem) => {
    console.log('openDrawer called with item:', item.title);
    setSelectedItem(item);
    setIsCreateMode(false);
    setIsDrawerOpen(true);
    console.log('State should be updated to:', { isDrawerOpen: true, selectedItem: item.title });
  };

  const openCreateDrawer = () => {
    console.log('openCreateDrawer called');
    setSelectedItem(null);
    setIsCreateMode(true);
    setIsDrawerOpen(true);
    console.log('State should be updated to:', { isDrawerOpen: true, isCreateMode: true });
  };

  const closeDrawer = () => {
    console.log('closeDrawer called - resetting all state');
    setIsDrawerOpen(false);
    setSelectedItem(null);
    setIsCreateMode(false);
  };

  const value: ReferenceContextType = {
    referenceItems,
    selectedItem,
    isDrawerOpen,
    isCreateMode,
    addReference,
    updateReference,
    deleteReference,
    selectReference,
    openDrawer,
    openCreateDrawer,
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