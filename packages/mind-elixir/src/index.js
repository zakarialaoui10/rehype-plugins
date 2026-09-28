import { visit } from "unist-util-visit";
import { parseAllDocuments } from "yaml";

import { parseMindBody } from "./utils.js";

const rehypeMindElixir = ({ useCdn = true } = {}) => {
  return function transformer(tree) {
    let hasElixirMind = false;

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

      if (!classes.includes("language-mind-elixir")) {
        return;
      }

      hasElixirMind = true;

      // Extract the text contained in <code>
      const value = code.children
        .filter((child) => child.type === "text")
        .map((child) => child.value)
        .join("");

      let config = {};
      let body = null;

      // Parse multi-document YAML using yaml's parseAllDocuments
      const yamlDocs = parseAllDocuments(value.trim());

      if (yamlDocs.length === 1) {
        // If it's a single document, check if parseMindBody can handle it (supports JSON/JS/YAML)
        body = parseMindBody(yamlDocs[0].toString());
      } else if (yamlDocs.length >= 2) {
        config = yamlDocs[0].toJSON() || {};
        body = parseMindBody(yamlDocs[1].toString());
      }

      const serializedBody = JSON.stringify(body, (key, value) => {
        if (key === "parent") return undefined;
        return value;
      });

      const serializedConfig = JSON.stringify(config);

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          "data-mind-elixir": "",
          "data-xmind-body": serializedBody,
          "data-xmind-config": serializedConfig,
        },
        children: [],
      };
    });

    if (!hasElixirMind || !useCdn) {
      return;
    }

    const styleNode = {
      type: "element",
      tagName: "style",
      properties: {},
      children: [
        {
          type: "raw",
          value: "@import url('https://esm.sh/mind-elixir/style')",
        },
      ],
    };

    const scriptNode = {
      type: "element",
      tagName: "script",
      properties: {
        type: "module",
        "data-engine": "zikojs, rehype, mind-elixir",
      },
      children: [
        {
          type: "raw",
          value: `
import { MindMap } from 'https://esm.sh/@zikojs/mind-elixir@latest/src/mind/main.js'
import { tags } from 'https://esm.sh/ziko@latest/src/dom/tags/index.js'          

function initMindMaps() {
  document.querySelectorAll('[data-mind-elixir]').forEach((element) => {
    if (element.dataset.rendered) return;
    
    const body = element.dataset.xmindBody;
    const config = element.dataset.xmindConfig;

    if (!body) return;

    element.dataset.rendered = "true";
    const nodeData = JSON.parse(body);
    const nodeConfig = config ? JSON.parse(config) : {};

    const map = MindMap(
      { height: '400px', width : '300px', ...nodeConfig },
      nodeData
    );

    tags.div({}, map).style({
      display : 'flex',
      justifyContent: 'center',
      border : '1px darkblue solid'
    }).mount(element)

  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMindMaps);
} else {
  initMindMaps();
}
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

export default rehypeMindElixir;