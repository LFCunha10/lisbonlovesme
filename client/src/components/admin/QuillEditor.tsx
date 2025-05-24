import React from "react";
import "react-quill/dist/quill.snow.css";
import { useToast } from "@/hooks/use-toast";

// Add custom styles for the editor
const editorStyles = `
  .tour-editor {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
  }
  .tour-editor .editor-container {
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    overflow: hidden;
  }
  .tour-editor .toolbar {
    background-color: #f9fafb;
    border-bottom: 1px solid #d1d5db;
    padding: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .tour-editor .toolbar button {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
  }
  .tour-editor .toolbar button:hover {
    background: #f3f4f6;
  }
  .tour-editor .content-area {
    min-height: 200px;
    max-height: 200px;
    overflow-y: auto;
    padding: 12px;
    background: white;
  }
  .tour-editor .content-area:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

// Inject styles once
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = editorStyles;
  document.head.appendChild(style);
}

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuillEditor({ value, onChange, className }: QuillEditorProps) {
  const { toast } = useToast();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = value || '';
    }
  }, []);

  // Handle input changes
  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  // Handle formatting
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    contentRef.current?.focus();
  };
  
  // Handle image upload
  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      if (!input.files?.length) return;

      const file = input.files[0];
      // File size validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image is too large. Maximum size is 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create form data for upload
      const formData = new FormData();
      formData.append("image", file);

      try {
        // Upload the image to server
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        
        // Insert the image using execCommand
        document.execCommand('insertImage', false, data.imageUrl);
        handleInput();

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error) {
        console.error("Image upload error:", error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    };
  };

  return (
    <div className={`tour-editor ${className || ""}`}>
      <div className="editor-container">
        <div className="toolbar">
          <button type="button" onClick={() => formatText('formatBlock', '<h1>')}>H1</button>
          <button type="button" onClick={() => formatText('formatBlock', '<h2>')}>H2</button>
          <button type="button" onClick={() => formatText('formatBlock', '<h3>')}>H3</button>
          <button type="button" onClick={() => formatText('formatBlock', '<p>')}>Normal</button>
          <button type="button" onClick={() => formatText('bold')}>Bold</button>
          <button type="button" onClick={() => formatText('italic')}>Italic</button>
          <button type="button" onClick={() => formatText('underline')}>Underline</button>
          <button type="button" onClick={() => formatText('insertUnorderedList')}>List</button>
          <button type="button" onClick={() => formatText('insertOrderedList')}>Numbered</button>
          <button type="button" onClick={() => formatText('justifyLeft')}>Left</button>
          <button type="button" onClick={() => formatText('justifyCenter')}>Center</button>
          <button type="button" onClick={() => formatText('justifyRight')}>Right</button>
          <button type="button" onClick={handleImageUpload}>Image</button>
        </div>
        <div
          ref={contentRef}
          className="content-area"
          contentEditable
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
      </div>
    </div>
  );
}
