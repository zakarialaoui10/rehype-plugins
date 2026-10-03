# rehype-mind-elixir

A [rehype](https://github.com/rehypejs/rehype) plugin for embedding interactive [Mind Elixir](https://docs.mind-elixir.com/) mind maps in Markdown.

It detects `mind-elixir` fenced code blocks after Markdown has been converted to HAST and transforms them into interactive Mind Elixir maps.

## Features

* 📝 Define mind maps directly in Markdown
* 🌳 Plain-text, JSON, and JSON-like mind-map syntax
* ⚙️ Optional YAML configuration
* ⚡ Automatic client-side rendering
* 🌐 Optional CDN-based runtime
* 🔌 Works with the unified ecosystem
* 🧩 Built on top of [ZikoJS](https://github.com/zikojs)

## Installation

```bash
npm install rehype-mind-elixir
```

## Usage

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeMindElixir from 'rehype-mind-elixir'

const markdown = `
# My Mind Map

\`\`\`mind-elixir
- JavaScript
  - Browser
    - DOM
    - Web APIs
  - Node.js
  - Deno
\`\`\`
`

const file = await unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeMindElixir)
  .use(rehypeStringify)
  .process(markdown)

console.log(String(file))
```

## Usage with Astro

Install the plugin:

```bash
npm install rehype-mind-elixir
```

Then add it to your `rehypePlugins` configuration:

```js
// @ts-check
import { defineConfig } from 'astro/config'
import { unified } from 'unified'
import rehypeMindElixir from 'rehype-mind-elixir'

export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: [
        rehypeMindElixir,
      ],
    }),
  },
})
```

You can then use `mind-elixir` blocks directly in your Markdown or MDX pages:

````markdown
# JavaScript

```mind-elixir
- JavaScript
  - Browser
    - DOM
    - Web APIs
  - Node.js
  - Deno
```
````

The Markdown code block is first converted to HAST and then transformed by `rehype-mind-elixir`.

## Markdown Syntax

Use a `mind-elixir` fenced code block to define a mind map.

### Plain text

The plain-text syntax uses indentation to describe the hierarchy:

````markdown
```mind-elixir
- JavaScript
  - Browser
    - DOM
    - Web APIs
  - Node.js
  - Deno
```
````

Plain text also supports node references and links:

````markdown
```mind-elixir
- Root
  - Node A [^id1]
  - Node B [^id2]
  - > [^id1] <-Link Label-> [^id2]
```
````

### JSON

Standard Mind Elixir data can also be provided as JSON:

````markdown
```mind-elixir
{
  "topic": "JavaScript",
  "children": [
    {
      "topic": "Browser"
    },
    {
      "topic": "Node.js"
    }
  ]
}
```
````

### JSON-like

JavaScript object and array syntax is also supported:

````markdown
```mind-elixir
{
  topic: "JavaScript",
  children: [
    {
      topic: "Browser",
      children: [
        { topic: "DOM" },
        { topic: "Web APIs" }
      ]
    },
    {
      topic: "Node.js"
    }
  ]
}
```
````

## Configuration

Optional Mind Elixir configuration can be placed before the mind-map data.

Separate the configuration and body using `---`.

The configuration section uses YAML. The mind-map body can then use plain text, JSON, or JSON-like syntax.

For example:

````markdown
```mind-elixir
height : 300px
width : 600px
direction : 2
---
- JavaScript
  - Browser
  - Node.js
  - Deno
```
````

The part before `---` is parsed as YAML configuration:

```yaml
height : 300px
width : 600px
direction : 2
```

The part after `---` is parsed as the mind-map body.

### JSON body with configuration

````markdown
```mind-elixir
height : 400px
width : 600px
---
{
  "topic": "JavaScript",
  "children": [
    {
      "topic": "Browser"
    },
    {
      "topic": "Node.js"
    }
  ]
}
```
````

### JSON-like body with configuration

````markdown
```mind-elixir
height : 400px
width : 600px
---
{
  topic: "JavaScript",
  children: [
    { topic: "Browser" },
    { topic: "Node.js" }
  ]
}
```
````

> YAML is used for the configuration section only. It is not supported as a mind-map body format.

## Multiple Mind Maps

A Markdown document can contain multiple `mind-elixir` blocks:

````markdown
# Frontend

```mind-elixir
- Frontend
  - HTML
  - CSS
  - JavaScript
```

# Backend

```mind-elixir
- Backend
  - Node.js
  - Python
  - Rust
```
````

The client runtime is injected only once when at least one mind map is present.

## Options

```js
rehypeMindElixir({
  useCdn: true,
})
```

### `useCdn`

Controls whether the plugin injects the browser runtime from a CDN.

**Type:** `boolean`

**Default:** `true`

```js
rehypeMindElixir({
  useCdn: false,
})
```

When disabled, the plugin does not inject the CDN runtime. Your application must provide the client runtime.

## Client Runtime

By default, the plugin injects the required browser runtime using `esm.sh`.

The generated HTML contains a container similar to:

```html
<div
  data-mind-elixir
  data-xmind-body="..."
  data-xmind-type="plain-text"
  data-xmind-config="..."
></div>
```

`data-xmind-type` identifies the body format:

* `plain-text`
* `json`
* `json-like`

The client runtime uses this information to parse the body before passing it to Mind Elixir.

## Astro with CDN Disabled

When `useCdn` is disabled:

```js
import { defineConfig } from 'astro/config'
import { unified } from 'unified'
import rehypeMindElixir from 'rehype-mind-elixir'

export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: [
        rehypeMindElixir({
          useCdn: false,
        }),
      ],
    }),
  },
})
```

Then import the client runtime from your application:

```js
import 'rehype-mind-elixir/client'
```

The client module finds all `[data-mind-elixir]` elements generated by the plugin and mounts the corresponding Mind Elixir maps.

## How It Works

```text
Markdown
   │
   ▼
remark-parse
   │
   ▼
MDAST
   │
   ▼
remark-rehype
   │
   ▼
HAST
   │
   ▼
rehype-mind-elixir
   │
   ├── Find <pre><code class="language-mind-elixir">
   │
   ├── Extract the code content
   │
   ├── Split configuration and body
   │
   ├── Parse YAML configuration
   │
   ├── Detect body type
   │      ├── Plain text
   │      ├── JSON
   │      └── JSON-like
   │
   └── Replace the code block with a Mind Elixir container
          │
          ▼
       HAST
          │
          ▼
   rehype-stringify
          │
          ▼
        HTML
          │
          ▼
   Mind Elixir client runtime
          │
          ├── plainTextToMindNodes()
          ├── JSON.parse()
          └── JSON.parse()
          │
          ▼
     Mind Elixir map
```

Because the plugin operates on HAST rather than MDAST, it is a **rehype plugin**.

## Ecosystem

`rehype-mind-elixir` works with unified-based Markdown pipelines and can be used with tools such as Astro and MDX.

It uses [ZikoJS](https://github.com/zikojs) utilities internally while remaining an independent rehype plugin.

## Related Projects

* [Mind Elixir](https://docs.mind-elixir.com/) — interactive mind-map library
* [ZikoJS](https://github.com/zikojs) — JavaScript toolkit used by the plugin

## License

MIT + Mind Elixir License
