import { createContext, useContext, useState, ReactNode } from "react";
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
    setSelectedItem(item);
    setIsDrawerOpen(true);
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
    throw new Error("useReference must be used within a ReferenceProvider");
  }
  return context;
}