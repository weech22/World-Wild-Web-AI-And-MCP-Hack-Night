import { useReference } from "@/providers/ReferenceProvider";
import { Button } from "@/components/button/Button";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { X, FileText, Link, Note } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function ReferenceDrawer() {
  console.log('ReferenceDrawer rendering...');
  const { selectedItem, isDrawerOpen, closeDrawer, updateReference } = useReference();
  const [editedContent, setEditedContent] = useState("");
  
  console.log('ReferenceDrawer got context:', { 
    isDrawerOpen, 
    selectedItem: selectedItem?.title || 'none',
    closeDrawer: typeof closeDrawer
  });

  useEffect(() => {
    console.log('ReferenceDrawer state changed:', { isDrawerOpen, selectedItem: selectedItem?.title });
  }, [isDrawerOpen, selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      setEditedContent(selectedItem.details);
    }
  }, [selectedItem]);

  const handleSave = () => {
    if (selectedItem) {
      updateReference(selectedItem.id, { details: editedContent });
      closeDrawer();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText size={16} />;
      case "link":
        return <Link size={16} />;
      case "note":
        return <Note size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
      case "link":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "note":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  if (!isDrawerOpen || !selectedItem) {
    console.log('ReferenceDrawer returning null:', { isDrawerOpen, hasSelectedItem: !!selectedItem });
    return null;
  }
  
  console.log('ReferenceDrawer rendering drawer!');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-neutral-900 shadow-xl z-[9999] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(selectedItem.type)}`}>
              {getTypeIcon(selectedItem.type)}
              {selectedItem.type}
            </div>
            <h2 className="text-lg font-semibold truncate">{selectedItem.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeDrawer}
            className="h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
              Content
            </label>
            <TiptapEditor
              content={editedContent}
              onUpdate={setEditedContent}
              placeholder="Edit the reference content..."
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">
            Created: {selectedItem.createdAt.toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}