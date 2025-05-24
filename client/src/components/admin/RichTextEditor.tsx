import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  
  // Initialize editor with value
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Format text
  const formatDoc = (command: string, value: string = '') => {
    if (!editorRef.current) return;
    
    // Focus the editor before applying command
    editorRef.current.focus();
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // Update content
    handleContentChange();
  };

  // Handle link insertion
  const insertLink = () => {
    if (linkUrl && linkText) {
      formatDoc('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
      setLinkUrl('');
      setLinkText('');
      setShowLinkPopover(false);
    }
  };

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted">
        {/* Text styling */}
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('bold')}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('italic')}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <div className="h-6 w-px bg-gray-300 mx-1" />
        
        {/* Headings */}
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('formatBlock', '<h2>')}
          aria-label="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('formatBlock', '<h3>')}
          aria-label="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
        
        <div className="h-6 w-px bg-gray-300 mx-1" />
        
        {/* Lists */}
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('insertUnorderedList')}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('insertOrderedList')}
          aria-label="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        
        <div className="h-6 w-px bg-gray-300 mx-1" />
        
        {/* Text alignment */}
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('justifyLeft')}
          aria-label="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('justifyCenter')}
          aria-label="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => formatDoc('justifyRight')}
          aria-label="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
        
        <div className="h-6 w-px bg-gray-300 mx-1" />
        
        {/* Link */}
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              aria-label="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Link Text
                </label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text to display"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  URL
                </label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLinkPopover(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={insertLink}
                  disabled={!linkText || !linkUrl}
                >
                  Insert Link
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
        onInput={handleContentChange}
        onBlur={handleContentChange}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />
    </div>
  );
}