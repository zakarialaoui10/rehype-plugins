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
      ('dataMindElixir' in node.properties ||
        'data-mind-elixir' in node.properties)
  )

describe('rehypeMindElixir', () => {
  it('transforms a mind-elixir code block into a Mind Elixir element', () => {
    const tree = processMarkdown(mindElixirMarkdown)

    const mindMaps = getMindMaps(tree)

    expect(mindMaps).toHaveLength(1)

    const mindMap = mindMaps[0]

    expect(mindMap.tagName).toBe('div')
    expect(mindMap.properties).toHaveProperty('dataMindElixir')
    expect(mindMap.properties).toHaveProperty('dataXmindBody')
    expect(mindMap.properties).toHaveProperty('dataXmindConfig')
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

    expect(mindMap.properties).toHaveProperty('dataXmindBody')
    expect(mindMap.properties).toHaveProperty('dataXmindConfig')

    expect(
      mindMap.properties.dataXmindConfig
    ).toContain('direction')

    expect(
      mindMap.properties.dataXmindConfig
    ).toContain('600px')
  })

  it('removes parent properties from serialized mind map data', () => {
    const tree = processMarkdown(mindElixirMarkdown)

    const mindMap = getMindMaps(tree)[0]

    expect(mindMap).toBeDefined()

    const body = mindMap.properties.dataXmindBody

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
        node.tagName === 'link' &&
        node.properties?.rel?.includes('stylesheet') &&
        node.properties?.href === 'https://esm.sh/mind-elixir/style'
    )

    const scriptNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'script' &&
        node.properties?.src ===
          'https://esm.sh/rehype-mind-elixir@latest/client'
    )

    expect(styleNode).toBeDefined()
    expect(scriptNode).toBeDefined()

    expect(styleNode.properties.rel).toContain('stylesheet')
    expect(styleNode.properties.href).toBe(
      'https://esm.sh/mind-elixir/style'
    )

    expect(scriptNode.properties.type).toBe('module')
    expect(scriptNode.properties.src).toBe(
      'https://esm.sh/rehype-mind-elixir@latest/client'
    )

    expect(
      scriptNode.properties.dataEngine ||
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
        node.tagName === 'link' &&
        node.properties?.rel?.includes('stylesheet') &&
        node.properties?.href === 'https://esm.sh/mind-elixir/style'
    )

    const scriptNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'script' &&
        node.properties?.src ===
          'https://esm.sh/rehype-mind-elixir@latest/client'
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
        (
          node.tagName === 'style' ||
          (
            node.tagName === 'link' &&
            node.properties?.href ===
              'https://esm.sh/mind-elixir/style'
          )
        )
    )

    const scriptNode = tree.children.find(
      node =>
        node.type === 'element' &&
        node.tagName === 'script' &&
        node.properties?.src ===
          'https://esm.sh/rehype-mind-elixir@latest/client'
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
        node.properties?.src ===
          'https://esm.sh/rehype-mind-elixir@latest/client'
    )

    expect(scripts).toHaveLength(1)
  })
})
