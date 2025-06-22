import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'

function App() {
  const [html, setHtml] = useState('')

  return (
    <div style={{ padding: 20 }}>
      <h2>Editor</h2>
      <RichTextEditor onChange={setHtml} />

      <h2>Preview (Formatted Output)</h2>
      <div
        style={{ border: '1px dashed #999', marginTop: 20, padding: 20 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export default App
