import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuillEditor({ value, onChange, className }: QuillEditorProps) {
  const [editorValue, setEditorValue] = useState(value || '');
  
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
  
  // Quill editor modules/formats
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link'
  ];
  
  return (
    <div className={className}>
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        className="min-h-[200px]"
      />
      {/* Custom styles for Quill */}
    </div>
  );
}