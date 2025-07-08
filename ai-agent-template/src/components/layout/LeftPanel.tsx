import { Card } from "@/components/card/Card";
import { Button } from "@/components/button/Button";
import { useReference } from "@/providers/ReferenceProvider";
import { Article, PlusCircle, Link, Note } from "@phosphor-icons/react";

export function LeftPanel() {
  console.log("LeftPanel rendering...");
  const { referenceItems, openDrawer, openCreateDrawer, addReference } = useReference();
  console.log("LeftPanel got context:", {
    referenceItemsCount: referenceItems.length,
    openDrawer: typeof openDrawer,
    addReference: typeof addReference,
  });

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
        return "text-blue-600";
      case "link":
        return "text-green-600";
      case "note":
        return "text-yellow-600";
      default:
        return "text-neutral-600";
    }
  };

  const handleAddReference = () => {
    // Open create drawer instead of directly creating reference
    openCreateDrawer();
  };
  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Reference Material</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddReference}
            className="h-8 w-8 p-0"
          >
            <PlusCircle size={16} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {referenceItems.length === 0 ? (
          <div className="text-center py-8">
            <Article size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-neutral-500 text-sm">
              No reference material yet
            </p>
            <p className="text-neutral-400 text-xs mt-1">
              AI will populate this as you chat
            </p>
          </div>
        ) : (
          referenceItems.map((item) => (
            <Card
              key={item.id}
              className="p-3 cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-800"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("=== CLICK EVENT ===");
                console.log("Clicked reference item:", item.title);
                console.log("openDrawer function:", typeof openDrawer);
                console.log("About to call openDrawer...");
                openDrawer(item);
                console.log("openDrawer called");
              }}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">
                      {item.title}
                    </h3>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${getTypeColor(item.type)} bg-opacity-10`}
                    >
                      {item.type}
                    </span>
                  </div>
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
