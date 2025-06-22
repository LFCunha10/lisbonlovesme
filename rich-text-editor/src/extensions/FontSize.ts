import { Mark, mergeAttributes } from '@tiptap/core'

export interface FontSizeOptions {
  types: string[]
  defaultSize: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
    }
  }
}

export const FontSize = Mark.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
      defaultSize: '1rem',
    }
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
    }
  },

  parseHTML() {
    return [{ style: 'font-size' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setFontSize:
        size =>
        ({ commands }) => {
          return commands.setMark(this.name, { fontSize: size })
        },
    }
  },
})