import { 
  // yaml2MindElixirData,
  plainTextToMindNodes
 } from '@zikojs/mind-elixir/utils'

export function escapeHtmlAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
export const splitDocuments = (text) => {
  const documents = []
  let current = ''

  let quote = null
  let escaped = false

  const lines = text
    .replace(/\r\n?/g, '\n')
    .trim()
    .split('\n')

  for (const line of lines) {
    const isSeparator = /^---[ \t]*$/.test(line)

    if (isSeparator && !quote) {
      if (current.trim()) {
        documents.push(current.trim())
      }

      current = ''
      continue
    }

    current += (current ? '\n' : '') + line

    // Track JS string state
    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (quote) {
        if (char === quote) {
          quote = null
        }
      } else if (
        char === "'" ||
        char === '"' ||
        char === '`'
      ) {
        quote = char
      }
    }
  }

  if (current.trim()) {
    documents.push(current.trim())
  }

  return documents
}

export const parseMindBody = (text) => {
  const trimmed = text.trim()

  // JSON
  try {
    return JSON.parse(trimmed)
  } catch {}

  // JavaScript object/array
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[')
  ) {
    try {
      return Function(`"use strict"; return (${trimmed})`)()
    } catch {}
  }

  return plainTextToMindNodes(trimmed)
}