import { visit } from "unist-util-visit";
import { parseAllDocuments } from "yaml";

import { 
  parseMindBody,
  splitDocuments 
} from "./utils.js";

const rehypeMindElixir = ({ useCdn = true } = {}) => {
  return function transformer(tree) {
    let hasElixirMind = false;

    visit(tree, "element", (node, index, parent) => {
      if(node.tagName !== "pre" || !node.children?.length) {
        return;
      }

      const code = node.children.find(
        (child) => child.type === "element" && child.tagName === "code");
      if(!code) return;
      const className = code.properties?.className || [];
      const classes = Array.isArray(className) ? className : [className];
      if(!classes.includes("language-mind-elixir")) {
        return;
      }
      hasElixirMind = true;
      const value = code.children
        .filter((child) => child.type === "text")
        .map((child) => child.value)
        .join("");

      const documents = splitDocuments(value);

      let config = {};
      let bodyText;

      if(documents.length === 1) bodyText = documents[0];
      else {
        config = parseAllDocuments(documents[0])[0]?.toJSON() || {};
        bodyText = documents[1];
      }

      const parsedBody = parseMindBody(bodyText);

      /*
       * Keep plain text untouched.
       *
       * JSON and JSON-like data need serialization because they
       * are objects at this point.
       */
      const serializedBody = parsedBody.type === "plain-text"
          ? parsedBody.body
          : JSON.stringify(parsedBody.body);

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          "data-mind-elixir": "",
          "data-xmind-body": serializedBody,
          "data-xmind-type": parsedBody.type,
          "data-xmind-config": JSON.stringify(config),
        },
        children: [],
      };
    });

    if(!hasElixirMind || !useCdn) {
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
          value: `import 'https://esm.sh/rehype-mind-elixir@latest/client'`,
        },
      ],
    };

    let headNode = null;
    let bodyNode = null;

    visit(tree, "element", (node) => {
      if(node.tagName === "head") headNode = node;
      if(node.tagName === "body") bodyNode = node;
    });

    if(headNode) headNode.children.push(styleNode);
    else tree.children.unshift(styleNode);
    if(bodyNode) bodyNode.children.push(scriptNode);
    else tree.children.push(scriptNode);
  };
};

export default rehypeMindElixir;

