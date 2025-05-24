import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Image as ImageIcon,
  Link as LinkIcon,
  Heading
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [text, setText] = useState(value || '');
  const [imageUrl, setImageUrl] = useState('');
  const [showImagePopover, setShowImagePopover] = useState(false);
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onChange(e.target.value);
  };
  
  // Insert formatting tags
  const insertFormat = (tag: string) => {
    const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let newText = '';
    let cursorPosition = 0;
    
    switch (tag) {
      case 'bold':
        newText = textarea.value.substring(0, start) + 
                 `<strong>${selectedText}</strong>` + 
                 textarea.value.substring(end);
        cursorPosition = start + 8 + selectedText.length;
        break;
      case 'italic':
        newText = textarea.value.substring(0, start) + 
                 `<em>${selectedText}</em>` + 
                 textarea.value.substring(end);
        cursorPosition = start + 4 + selectedText.length;
        break;
      case 'h2':
        newText = textarea.value.substring(0, start) + 
                 `<h2>${selectedText}</h2>` + 
                 textarea.value.substring(end);
        cursorPosition = start + 4 + selectedText.length;
        break;
      default:
        return;
    }
    
    setText(newText);
    onChange(newText);
    
    // Set focus back and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };
  
  // Insert image
  const insertImage = () => {
    if (!imageUrl.trim()) return;
    
    const imageTag = `<img src="${imageUrl}" alt="Tour image" class="my-2 max-w-full rounded" />`;
    const newText = text + (text.endsWith('\n') ? '' : '\n') + imageTag + '\n';
    
    setText(newText);
    onChange(newText);
    setImageUrl('');
    setShowImagePopover(false);
  };

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormat('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormat('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormat('h2')}
          title="Heading"
        >
          <Heading className="h-4 w-4" />
        </Button>
        
        <Popover open={showImagePopover} onOpenChange={setShowImagePopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Insert Image</h4>
              <Input
                type="url"
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImagePopover(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={insertImage}
                  disabled={!imageUrl.trim()}
                >
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Text Editor */}
      <Textarea
        id="rich-text-editor"
        value={text}
        onChange={handleTextChange}
        className="resize-y min-h-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="Enter tour description with formatting..."
      />
      
      {/* Preview (optional) */}
      {text && (
        <div className="border-t p-3">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Preview:</h4>
          <div 
            className="prose max-w-none" 
            dangerouslySetInnerHTML={{ __html: text }}
          />
        </div>
      )}
    </div>
  );
}