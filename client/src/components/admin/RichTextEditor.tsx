import React, { useState, useEffect } from 'react';
import {
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading3, 
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

// Define allowed formatting options
type FormatOption = 'bold' | 'italic' | 'h2' | 'h3' | 'ul' | 'ol' | 'left' | 'center' | 'right';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Initialize editor with existing content
  useEffect(() => {
    if (value) {
      setHtmlContent(value);
      if (editorRef.current) {
        editorRef.current.innerHTML = value;
      }
    }
  }, []);

  // When the HTML content changes, update the external value
  useEffect(() => {
    onChange(htmlContent);
  }, [htmlContent, onChange]);

  // Apply formatting
  const formatText = (format: FormatOption) => {
    if (!editorRef.current) return;
    
    // Save selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Apply appropriate formatting
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'h2':
        document.execCommand('formatBlock', false, '<h2>');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, '<h3>');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'ol':
        document.execCommand('insertOrderedList', false);
        break;
      case 'left':
        document.execCommand('justifyLeft', false);
        break;
      case 'center':
        document.execCommand('justifyCenter', false);
        break;
      case 'right':
        document.execCommand('justifyRight', false);
        break;
      default:
        break;
    }
    
    // Update the content state
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  // Insert image
  const insertImage = () => {
    if (!editorRef.current || !imageUrl) return;
    
    document.execCommand('insertHTML', false, 
      `<img src="${imageUrl}" alt="Tour image" class="my-2 max-w-full h-auto rounded" />`
    );
    
    // Update content and reset form
    setHtmlContent(editorRef.current.innerHTML);
    setImageUrl('');
    setIsImagePopoverOpen(false);
  };

  // Insert link
  const insertLink = () => {
    if (!editorRef.current || !linkUrl) return;
    
    const linkHtml = `<a href="${linkUrl}" target="_blank" class="text-blue-500 hover:underline">${linkText || linkUrl}</a>`;
    document.execCommand('insertHTML', false, linkHtml);
    
    // Update content and reset form
    setHtmlContent(editorRef.current.innerHTML);
    setLinkUrl('');
    setLinkText('');
    setIsLinkPopoverOpen(false);
  };

  // Handle editor content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('h2')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('h3')}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('ul')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('ol')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('left')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('center')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => formatText('right')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        {/* Image inserter */}
        <Popover open={isImagePopoverOpen} onOpenChange={setIsImagePopoverOpen}>
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
                  onClick={() => setIsImagePopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  size="sm" 
                  onClick={insertImage}
                  disabled={!imageUrl}
                >
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Link inserter */}
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Insert Link</h4>
              <Input
                type="url"
                placeholder="URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Link Text (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLinkPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  size="sm" 
                  onClick={insertLink}
                  disabled={!linkUrl}
                >
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        className="p-3 min-h-[200px] max-h-[500px] overflow-y-auto"
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}