import { useReference } from "@/providers/ReferenceProvider";
import { Button } from "@/components/button/Button";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { X, Article, Link, Note } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function ReferenceDrawer() {
  console.log('ReferenceDrawer rendering...');
  const { selectedItem, isDrawerOpen, isCreateMode, closeDrawer, updateReference, addReference } = useReference();
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  
  console.log('ReferenceDrawer got context:', { 
    isDrawerOpen, 
    isCreateMode,
    selectedItem: selectedItem?.title || 'none',
    closeDrawer: typeof closeDrawer
  });

  useEffect(() => {
    console.log('ReferenceDrawer state changed:', { isDrawerOpen, isCreateMode, selectedItem: selectedItem?.title });
  }, [isDrawerOpen, isCreateMode, selectedItem]);

  useEffect(() => {
    if (isCreateMode) {
      // Reset for create mode
      setEditedTitle("");
      setEditedContent("");
    } else if (selectedItem) {
      // Set for edit mode
      setEditedTitle(selectedItem.title);
      setEditedContent(selectedItem.details);
    }
  }, [selectedItem, isCreateMode]);

  const handleSave = () => {
    console.log('🔄 handleSave called:', { isCreateMode, editedTitle, editedContent });
    
    if (isCreateMode) {
      // Create new reference
      if (editedTitle.trim()) {
        console.log('💾 Creating new reference...');
        addReference({
          title: editedTitle.trim(),
          content: editedContent || "New reference content",
          details: editedContent || "<p>New reference content</p>",
          type: "note",
        });
        closeDrawer();
      } else {
        console.warn('⚠️ Cannot save: title is empty');
      }
    } else if (selectedItem) {
      // Update existing reference
      console.log('📝 Updating existing reference...');
      updateReference(selectedItem.id, { 
        title: editedTitle,
        details: editedContent 
      });
      closeDrawer();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <Article size={16} />;
      case "link":
        return <Link size={16} />;
      case "note":
        return <Note size={16} />;
      default:
        return <Article size={16} />;
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

  if (!isDrawerOpen) {
    console.log('ReferenceDrawer returning null:', { isDrawerOpen });
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
            <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(isCreateMode ? "note" : selectedItem?.type || "note")}`}>
              {getTypeIcon(isCreateMode ? "note" : selectedItem?.type || "note")}
              {isCreateMode ? "note" : selectedItem?.type || "note"}
            </div>
            <h2 className="text-lg font-semibold truncate">
              {isCreateMode ? "Create New Reference" : selectedItem?.title || "Reference"}
            </h2>
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
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          {isCreateMode && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Title *
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter reference title..."
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          )}
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
              Content
            </label>
            <TiptapEditor
              content={editedContent}
              onUpdate={setEditedContent}
              placeholder={isCreateMode ? "Enter reference content..." : "Edit the reference content..."}
              className="w-full flex-1"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">
            {isCreateMode ? "Creating new reference..." : selectedItem && `Created: ${selectedItem.createdAt.toLocaleDateString()}`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isCreateMode && !editedTitle.trim()}
            >
              {isCreateMode ? "Create Reference" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}