import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/button/Button';
import { TextB, TextItalic, ListBullets, ListNumbers, Quotes, ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';

interface TiptapEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({ content, onUpdate, placeholder = "Start typing...", className = "" }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
        >
          <TextB size={16} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
        >
          <TextItalic size={16} />
        </Button>
        
        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
        >
          <ListBullets size={16} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
        >
          <ListNumbers size={16} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
        >
          <Quotes size={16} />
        </Button>
        
        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <ArrowCounterClockwise size={16} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <ArrowClockwise size={16} />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  );
}