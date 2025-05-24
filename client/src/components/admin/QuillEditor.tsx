import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageIcon, Loader2, Link, ListOrdered, List, AlignLeft, Bold, Italic, Underline } from 'lucide-react';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuillEditor({ value, onChange, className }: QuillEditorProps) {
  const [content, setContent] = useState(value || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  
  // Update state when the value prop changes
  useEffect(() => {
    if (value !== undefined && value !== content) {
      setContent(value);
    }
  }, [value]);
  
  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange(newContent);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image is too large. Maximum size is 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingImage(true);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      // Upload the image to server
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Insert the image markdown into the content
      const imageMarkdown = `![Image](${data.imageUrl})`;
      const textArea = document.getElementById('tour-description') as HTMLTextAreaElement;
      
      if (textArea) {
        const cursorPosition = textArea.selectionStart;
        const textBefore = content.substring(0, cursorPosition);
        const textAfter = content.substring(cursorPosition);
        
        const newContent = `${textBefore}\n${imageMarkdown}\n${textAfter}`;
        setContent(newContent);
        onChange(newContent);
        
        // Set the cursor position after the inserted image
        setTimeout(() => {
          textArea.focus();
          const newPosition = cursorPosition + imageMarkdown.length + 2;
          textArea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
      
      toast({
        title: "Success",
        description: "Image inserted successfully",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Insert formatting at cursor position
  const insertFormat = (format: string) => {
    const textArea = document.getElementById('tour-description') as HTMLTextAreaElement;
    if (!textArea) return;
    
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        cursorOffset = 3;
        break;
      case 'link':
        formattedText = `[${selectedText}](https://example.com)`;
        cursorOffset = 1;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        cursorOffset = 2;
        break;
      case 'ordered-list':
        formattedText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        cursorOffset = 3;
        break;
      case 'heading':
        formattedText = `## ${selectedText}`;
        cursorOffset = 3;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    onChange(newContent);
    
    // Set the cursor position after the formatting
    setTimeout(() => {
      textArea.focus();
      const newPosition = end + cursorOffset;
      textArea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };
  
  return (
    <div className={className}>
      <div className="border rounded-md mb-2">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => insertFormat('heading')}
            title="Heading"
          >
            H2
          </Button>
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
            onClick={() => insertFormat('underline')}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-4 border-l border-gray-300"></span>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => insertFormat('list')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => insertFormat('ordered-list')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-4 border-l border-gray-300"></span>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => insertFormat('link')}
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <label htmlFor="image-upload">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              disabled={uploadingImage}
              title="Insert Image"
              asChild
            >
              <span>
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Uploading...
                  </>
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </span>
            </Button>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploadingImage}
          />
        </div>
        <Textarea
          id="tour-description"
          value={content}
          onChange={handleTextChange}
          className="min-h-[300px] rounded-none border-0 focus-visible:ring-0 resize-none"
          placeholder="Enter tour description here..."
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use Markdown formatting: **bold**, *italic*, [link](url), ![image](url), ## heading, - list item, 1. numbered list
      </p>
    </div>
  );
}