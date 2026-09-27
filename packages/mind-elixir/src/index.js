import { visit } from "unist-util-visit";
import { parse } from "yaml";

import { splitDocuments, parseMindBody } from "./utils.js";

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

      const documents = splitDocuments(value.trim());

      if (documents.length === 1) {
        body = parseMindBody(documents[0]);
      } else {
        config = parse(documents[0]);
        body = parseMindBody(documents[1]);
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

    tree.children.push({
      type: "element",
      tagName: "style",
      properties: {},
      children: [
        {
          type: "raw",
          value: "@import url('https://esm.sh/mind-elixir/style')",
        },
      ],
    });

    tree.children.push({
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-mind-elixir]').forEach((element) => {
    const body = element.dataset.xmindBody
    const config = element.dataset.xmindConfig

    if (!body) return

    const nodeData = JSON.parse(body)
    const nodeConfig = JSON.parse(config)

    const map = MindMap(
      { height: '400px', ...nodeConfig },
      nodeData
    )

    map.mount(element)
  })
})
`,
        },
      ],
    });
  };
};

export default rehypeMindElixir;
