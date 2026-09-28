import { parse, parseAllDocuments } from "yaml";

const data = `
console.log('\n---\n')
---
d2 : 10
---
d3 : 10
`



const splitDocuments = (text) => {
  const documents = []
  let current = ''

  let quote = null
  let escaped = false

  const lines = text.trim().split('\n')

  for (const line of lines) {
    const isSeparator = line.match(/^---[ \t]*$/)

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

console.log(splitDocuments(data))

// const SPLITTER = '\n---\n'
// console.log(data.trim().split(SPLITTER))


// const p = parseAllDocuments(data)
// console.log(data.trim().split(SPLITTER))
// console.log(p[0].toJSON())
// console.log(p[1].toJSON())
// console.log(p[2].toJSON())
