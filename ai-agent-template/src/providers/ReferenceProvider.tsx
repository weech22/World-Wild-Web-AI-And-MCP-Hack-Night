import { createContext, useContext, useState, type ReactNode } from "react";
import { MOCK_REFERENCES } from "@/constants/mockData";

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

  console.log('ReferenceProvider rendered:', { 
    referenceItemsCount: referenceItems.length, 
    isDrawerOpen, 
    selectedItem: selectedItem?.title || 'none' 
  });

  const addReference = (referenceData: Omit<ReferenceItem, "id" | "createdAt">) => {
    const newReference: ReferenceItem = {
      ...referenceData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setReferenceItems(prev => [...prev, newReference]);
  };

  const updateReference = (id: string, updates: Partial<ReferenceItem>) => {
    setReferenceItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteReference = (id: string) => {
    setReferenceItems(prev => prev.filter(item => item.id !== id));
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