import { visit } from "unist-util-visit";
import { parse } from "yaml";

const rehypeGlimpe = ({ useCdn = true } = {}) => {
  return function transformer(tree) {
    let isGlimpse = false;

    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || !node.children?.length) {
        return;
      }

      const code = node.children.find(
        (child) => child.type === "element" && child.tagName === "code",
      );

      if (!code) return;

      const className = code.properties?.className || [];
      const classes = Array.isArray(className) ? className : [className];

      if (!classes.includes("language-glimpse")) {
        return;
      }

      isGlimpse = true;

      // Extract the text contained in <code>
      const value = code.children
        .filter((child) => child.type === "text")
        .map((child) => child.value)
        .join("");

      // Parse single-document YAML using yaml's parse
      const config = parse(value.trim()) || {};
      const serializedConfig = JSON.stringify(config);

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          "data-glimpse": "",
          "data-glimpse-config": serializedConfig,
        },
        // children: [],
      };
    });

    if (!isGlimpse || !useCdn) {
      return;
    }

    const styleNode = {
      type: "element",
      tagName: "style",
      properties: {},
      children: [
        {
          type: "raw",
          value: "@import url('https://esm.sh/zextra@latest/src/components/nav/glimpse/index.css')",
        },
      ],
    };

    const scriptNode = {
      type: "element",
      tagName: "script",
      properties: {
        type: "module",
        "data-engine": "zikojs, rehype",
      },
      children: [
        {
          type: "raw",
          value: `
import { Glimpse } from 'https://esm.sh/zextra@latest/src/components/nav/glimpse/main.js'

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-glimpse]').forEach((element) => {
      const serialized_config = element.dataset?.glimpseConfig
      const config = JSON.parse(serialized_config)
      const { label, ...options} = config
      Glimpse(options, label).mount(element)
    })
})
`,
        },
      ],
    };

    // Safely find <head> and <body> if they exist, otherwise fallback to root tree
    let headNode = null;
    let bodyNode = null;

    visit(tree, "element", (node) => {
      if (node.tagName === "head") headNode = node;
      if (node.tagName === "body") bodyNode = node;
    });

    // Inject style into <head> (or prepend to root if no head exists)
    if (headNode) {
      headNode.children.push(styleNode);
    } else {
      tree.children.unshift(styleNode);
    }

    // Inject script into <body> (or append to root if no body exists)
    if (bodyNode) {
      bodyNode.children.push(scriptNode);
    } else {
      tree.children.push(scriptNode);
    }
  };
};

export default rehypeGlimpe;