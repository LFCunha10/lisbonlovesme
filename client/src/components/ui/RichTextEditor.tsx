import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import ImageResize from 'tiptap-extension-resize-image'
import Placeholder from '@tiptap/extension-placeholder'
import { FontSize } from '@/components/extensions/FontSize'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'

import {
  Bold, Italic, Underline as UnderlineIcon, Paintbrush,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Upload, Link as LinkIcon,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
}

const colorPalette = ['#e60000', '#008000', '#0000ff', '#ffa500', '#800080', '#000000', '#808080']
const fontOptions = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana', 'Tahoma', 'Trebuchet MS']
const sizeOptions = ['0.75rem', '1rem', '1.25rem', '1.5rem', '2rem', '2.5rem']

export function RichTextEditor({ value, onChange }: Props) {
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .ProseMirror {
        position: relative;
      }
      .ProseMirror:focus {
        outline: none;
        box-shadow: none;
        border: none;
      }
      .ProseMirror.is-editor-empty::before {
        content: attr(data-placeholder);
        color: #999;
        font-style: italic;
        position: absolute;
        top: 1rem;
        left: 1rem;
        pointer-events: none;
        font-size: 1rem;
        line-height: 1.5;
      }
      /* Table styling */
      .ProseMirror table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        margin: 0.5rem 0;
      }
      .ProseMirror th,
      .ProseMirror td {
        border: 1px solid #e5e7eb; /* gray-200 */
        padding: 0.5rem;
        vertical-align: top;
      }
      .ProseMirror th {
        background-color: #f9fafb; /* gray-50 */
        font-weight: 600;
        text-align: left;
      }
      .ProseMirror .selectedCell:after {
        content: '';
        position: absolute;
        left: 0; right: 0; top: 0; bottom: 0;
        background: rgba(59,130,246,0.14); /* blue-500 with opacity */
        pointer-events: none;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const [showColor, setShowColor] = useState(false)
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 })
  const paintRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      Color,
      Link,
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Image.configure({ inline: false, allowBase64: true }),
      ImageResize.configure({ inline: false }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'tiptap-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Type here',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onCreate: ({ editor }) => editor.commands.setColor('black'),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const toggleColor = () => {
    if (!paintRef.current) return
    const r = paintRef.current.getBoundingClientRect()
    setModalPos({ x: r.left, y: r.bottom + 4 })
    setShowColor(prev => !prev)
  }

  const insertUpload = () => fileRef.current?.click()

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && editor) {
      const formData = new FormData()
      formData.append('image', f)
      
      fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        if (data.imageUrl) {
          editor.chain().focus().setImage({ src: data.imageUrl }).run()
        }
      })
      .catch(error => {
        console.error('Image upload error:', error)
      })
    }
  }

  const setFont = (font: string) => editor?.chain().focus().setFontFamily(font).run()
  const setFontSize = (size: string) => editor?.chain().focus().setFontSize(size).run()

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (paintRef.current && !paintRef.current.contains(e.target as Node)) {
        setShowColor(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  if (!editor) return null

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={18} /></button>
        <button ref={paintRef} onClick={toggleColor}><Paintbrush size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify size={18} /></button>
        <button onClick={insertUpload}><Upload size={18} /></button>
        <button onClick={() => editor.chain().focus().setLink({ href: 'https://example.com' }).run()}><LinkIcon size={18} /></button>

        {/* Table controls */}
        <span style={{ width: 1, height: 22, background: '#e5e7eb', margin: '0 6px' }} />
        <button
          title="Insert table"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          style={{ fontSize: 12 }}
        >Table</button>
        <button title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()} style={{ fontSize: 12 }}>+Row</button>
        <button title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()} style={{ fontSize: 12 }}>+Col</button>
        <button title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()} style={{ fontSize: 12 }}>-Row</button>
        <button title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()} style={{ fontSize: 12 }}>-Col</button>
        <button title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()} style={{ fontSize: 12 }}>Del Tbl</button>

        <select onChange={(e) => setFont(e.target.value)} defaultValue="" style={{ fontSize: '14px' }}>
          <option value="" disabled>Font</option>
          {fontOptions.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
          ))}
        </select>

        <select onChange={(e) => setFontSize(e.target.value)} defaultValue="" style={{ fontSize: '14px' }}>
          <option value="" disabled>Size</option>
          {sizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {showColor && (
        <div style={{
          position: 'absolute',
          top: modalPos.y,
          left: modalPos.x,
          padding: 8,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 4,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {colorPalette.map(c => (
              <div
                key={c}
                onClick={() => { editor.chain().focus().setColor(c).run(); setShowColor(false) }}
                style={{
                  width: 24, height: 24, background: c,
                  border: '2px solid white',
                  borderRadius: '50%',
                  boxShadow: '0 0 2px rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <input type="file" accept="image/*" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />

      <div style={{
        resize: 'vertical',
        overflow: 'auto',
        minHeight: 200,
        maxHeight: 800,
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: 0,
        backgroundColor: 'white',
        display: 'flex',
        position: 'relative'
      }}>
        <EditorContent
          editor={editor}
          style={{
            flex: 1,
            minHeight: '100%',
            width: '100%',
            border: 'none',
            padding: '1rem',
            boxSizing: 'border-box',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            color: 'black',
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}
