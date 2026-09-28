import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeMindElixir from '../src/index.js'

const processMarkdown = (markdown, options = {}) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeMindElixir, options)

  const mdast = processor.parse(markdown)
  return processor.runSync(mdast)
}

const mindElixirMarkdown = `
\`\`\`mind-elixir
topic: Root
children:
  - topic: Child
\`\`\`
`

const getMindMaps = (tree) =>
  tree.children.filter(
    node =>
      node.type === 'element' &&
      node.tagName === 'div' &&
      node.properties &&
      'data-mind-elixir' in node.properties
  )

describe('rehypeMindElixir', () => {
  it('transforms a mind-elixir code block into a Mind Elixir element', () => {
    const tree = processMarkdown(mindElixirMarkdown)

    const mindMaps = getMindMaps(tree)

    expect(mindMaps).toHaveLength(1)

    const mindMap = mindMaps[0]

    expect(mindMap.tagName).toBe('div')
    expect(mindMap.properties).toHaveProperty('data-mind-elixir')
    expect(mindMap.properties).toHaveProperty('data-xmind-body')
    expect(mindMap.properties).toHaveProperty('data-xmind-config')
  })

  it('does not transform other code blocks', () => {
    const tree = processMarkdown(`
\`\`\`js
console.log('hello')
\`\`\`
`)

    expect(getMindMaps(tree)).toHaveLength(0)

    const pre = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'pre'
    )

    expect(pre).toBeDefined()

    const code = pre.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'code'
    )

    expect(code).toBeDefined()
    expect(code.properties.className).toContain('language-js')
  })

  it('supports a mind-elixir block with configuration', () => {
    const tree = processMarkdown(`
\`\`\`mind-elixir
---
direction: 1
height: 600px
---
topic: Root
children:
  - topic: Child
\`\`\`
`)

    const mindMaps = getMindMaps(tree)

    expect(mindMaps).toHaveLength(1)

    const mindMap = mindMaps[0]

    expect(mindMap.properties).toHaveProperty('data-xmind-body')
    expect(mindMap.properties).toHaveProperty('data-xmind-config')

    expect(
      mindMap.properties['data-xmind-config']
    ).toContain('direction')

    expect(
      mindMap.properties['data-xmind-config']
    ).toContain('600px')
  })

  it('removes parent properties from serialized mind map data', () => {
    const tree = processMarkdown(mindElixirMarkdown)

    const mindMap = getMindMaps(tree)[0]

    expect(mindMap).toBeDefined()

    const body = mindMap.properties['data-xmind-body']

    expect(body).toBeDefined()
    expect(body).not.toContain('parent')
  })

  it('injects CDN assets when useCdn is true', () => {
    const tree = processMarkdown(mindElixirMarkdown, {
      useCdn: true,
    })

    const styleNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'style' &&
        node.children.some(
          child =>
            child.type === 'text' &&
            child.value.includes('mind-elixir/style')
        )
    )

    const scriptNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'script' &&
        node.children.some(
          child =>
            child.type === 'text' &&
            child.value.includes('@zikojs/mind-elixir')
        )
    )

    expect(styleNode).toBeDefined()
    expect(scriptNode).toBeDefined()

    expect(scriptNode.properties.type).toBe('module')

    expect(
      scriptNode.properties['data-engine']
    ).toBe('zikojs, rehype, mind-elixir')
  })

  it('does not inject CDN assets when useCdn is false', () => {
    const tree = processMarkdown(mindElixirMarkdown, {
      useCdn: false,
    })

    const styleNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'style' &&
        node.children.some(
          child =>
            child.type === 'text' &&
            child.value.includes('mind-elixir/style')
        )
    )

    const scriptNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'script' &&
        node.children.some(
          child =>
            child.type === 'text' &&
            child.value.includes('@zikojs/mind-elixir')
        )
    )

    expect(styleNode).toBeUndefined()
    expect(scriptNode).toBeUndefined()
  })

  it('does not modify the tree when no mind-elixir block exists', () => {
    const tree = processMarkdown(`
# Hello

Some text.

\`\`\`js
console.log('hello')
\`\`\`
`)

    expect(getMindMaps(tree)).toHaveLength(0)

    const styleNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'style'
    )

    const scriptNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'script'
    )

    expect(styleNode).toBeUndefined()
    expect(scriptNode).toBeUndefined()
  })

  it('can transform multiple mind-elixir blocks', () => {
    const tree = processMarkdown(`
\`\`\`mind-elixir
topic: First
children:
  - topic: Child
\`\`\`

Some text.

\`\`\`mind-elixir
topic: Second
children:
  - topic: Child
\`\`\`
`)

    const mindMaps = getMindMaps(tree)

    expect(mindMaps).toHaveLength(2)

    const scripts = tree.children.filter(
      node =>
        node.type === 'element' &&
        node.tagName === 'script' &&
        node.children.some(
          child =>
            child.type === 'text' &&
            child.value.includes('@zikojs/mind-elixir')
        )
    )

    expect(scripts).toHaveLength(1)
  })
})