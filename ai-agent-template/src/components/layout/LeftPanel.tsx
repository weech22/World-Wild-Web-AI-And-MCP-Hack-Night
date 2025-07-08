import { Card } from "@/components/card/Card";
import { Button } from "@/components/button/Button";
import { FileText, Plus } from "@phosphor-icons/react";

interface ReferenceItem {
  id: string;
  title: string;
  content: string;
  type: "document" | "link" | "note";
  createdAt: Date;
}

interface LeftPanelProps {
  referenceItems: ReferenceItem[];
  selectedItem: ReferenceItem | null;
  onSelectItem: (item: ReferenceItem) => void;
  onAddReference: () => void;
}

export function LeftPanel({ 
  referenceItems, 
  selectedItem, 
  onSelectItem, 
  onAddReference 
}: LeftPanelProps) {
  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Reference Material</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddReference}
            className="h-8 w-8 p-0"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {referenceItems.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-neutral-500 text-sm">No reference material yet</p>
            <p className="text-neutral-400 text-xs mt-1">
              AI will populate this as you chat
            </p>
          </div>
        ) : (
          referenceItems.map((item) => (
            <Card
              key={item.id}
              className={`p-3 cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                selectedItem?.id === item.id 
                  ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-400 dark:border-neutral-600' 
                  : 'bg-white dark:bg-neutral-800'
              }`}
              onClick={() => onSelectItem(item)}
            >
              <div className="flex items-start gap-2">
                <FileText size={16} className="mt-0.5 text-neutral-500" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {item.content}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {item.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}