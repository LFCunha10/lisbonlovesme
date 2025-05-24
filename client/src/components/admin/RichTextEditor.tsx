import React, { useCallback, useState } from 'react';
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
  Undo,
  Redo,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [editorHtml, setEditorHtml] = useState(value || '');
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('left');
  
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  // Update parent component when editor content changes
  const handleEditorChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setEditorHtml(html);
      onChange(html);
    }
  }, [onChange]);
  
  // Initialize editor with initial value
  React.useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      setEditorHtml(value);
    }
  }, [value]);
  
  // Format text with the selected style
  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleEditorChange();
    editorRef.current?.focus();
  }, [handleEditorChange]);
  
  // Apply text alignment
  const applyTextAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
    setTextAlignment(alignment);
    
    switch (alignment) {
      case 'left':
        formatText('justifyLeft');
        break;
      case 'center':
        formatText('justifyCenter');
        break;
      case 'right':
        formatText('justifyRight');
        break;
    }
  }, [formatText]);
  
  // Insert link
  const insertLink = useCallback(() => {
    if (linkText && linkUrl) {
      formatText('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
      setIsLinkPopoverOpen(false);
      setLinkText('');
      setLinkUrl('');
    }
  }, [formatText, linkText, linkUrl]);
  
  return (
    <div className={cn("border rounded-md", className)}>
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-gray-50 dark:bg-gray-800">
        {/* Text formatting */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('bold')}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('italic')}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Headings */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('formatBlock', '<h2>')}
          aria-label="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('formatBlock', '<h3>')}
          aria-label="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Lists */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('insertUnorderedList')}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('insertOrderedList')}
          aria-label="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Alignment */}
        <Tabs 
          value={textAlignment} 
          onValueChange={(value) => applyTextAlignment(value as 'left' | 'center' | 'right')}
          className="h-8"
        >
          <TabsList className="h-8 bg-transparent">
            <TabsTrigger value="left" className="h-7 px-1 data-[state=active]:bg-muted">
              <AlignLeft className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="center" className="h-7 px-1 data-[state=active]:bg-muted">
              <AlignCenter className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="right" className="h-7 px-1 data-[state=active]:bg-muted">
              <AlignRight className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Insert link */}
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={isLinkPopoverOpen}
              aria-label="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="flex flex-col gap-2">
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
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLinkPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={insertLink}
                  disabled={!linkText || !linkUrl}
                >
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Undo/Redo */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('undo')}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => formatText('redo')}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Toggle>
      </div>
      
      <div
        ref={editorRef}
        className="min-h-[200px] p-3 outline-none"
        contentEditable
        onInput={handleEditorChange}
        dangerouslySetInnerHTML={{ __html: editorHtml || '' }}
        data-placeholder={placeholder}
        style={{
          minHeight: '200px',
        }}
      />
    </div>
  );
}