import React, { useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useToast } from "@/hooks/use-toast";

// Add custom styles to the document for taller editor
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .quill-editor .ql-container {
      min-height: 200px;
      border-bottom-left-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }
    .quill-editor .ql-toolbar {
      border-top-left-radius: 0.375rem;
      border-top-right-radius: 0.375rem;
      background-color: #f9fafb;
    }
    .quill-editor .ql-editor {
      min-height: 200px;
      max-height: 200px;
      overflow-y: auto;
    }
    .quill-editor {
      margin-bottom: 2.5rem;
      padding-bottom: 1rem;
    }
  `;
  document.head.appendChild(style);
}

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuillEditor({ value, onChange, className }: QuillEditorProps) {
  const [editorValue, setEditorValue] = useState(value || "");
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();

  // Image handler to upload images
  const imageHandler = () => {
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

        // Insert the image into the editor
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, "image", data.imageUrl);
        }

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

  // Set the initial value when the component mounts
  useEffect(() => {
    if (value !== undefined) {
      setEditorValue(value);
    }
  }, [value]);

  // Handle changes and propagate to parent
  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  // Quill editor modules/formats with image handling
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
    "image",
  ];

  return (
    <div className={`quill-editor ${className || ""}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        style={{ height: "250px" }}
      />
    </div>
  );
}
