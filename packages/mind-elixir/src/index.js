import { visit, SKIP } from "unist-util-visit";
import { parseAllDocuments } from "yaml";
import { toString } from "hast-util-to-string";

import { 
  parseMindBody,
  splitDocuments 
} from "./utils.js";

const rehypeMindElixir = ({ useCdn = true } = {}) => {
  return function transformer(tree) {
    let hasElixirMind = false;
    let headNode = null;
    let bodyNode = null;

    visit(tree, "element", (node, index, parent) => {
      if (node.tagName === "head") headNode = node;
      if (node.tagName === "body") bodyNode = node;

      if (node.tagName !== "pre" || !node.children?.length) {
        return;
      }

      const code = node.children.find(
        (child) => child.type === "element" && child.tagName === "code"
      );
      if (!code) return;

      const className = code.properties?.className || [];
      const classes = Array.isArray(className) ? className : [className];
      if (!classes.includes("language-mind-elixir")) {
        return;
      }

      hasElixirMind = true;

      const value = toString(code);
      const documents = splitDocuments(value);

      let config = {};
      let bodyText;

      if (documents.length === 1) {
        bodyText = documents[0];
      } else {
        config = parseAllDocuments(documents[0])[0]?.toJSON() || {};
        bodyText = documents[1];
      }

      const parsedBody = parseMindBody(bodyText);

      const serializedBody = parsedBody.type === "plain-text"
        ? parsedBody.body
        : JSON.stringify(parsedBody.body);

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          dataMindElixir: "",
          dataXmindBody: serializedBody,
          dataXmindType: parsedBody.type,
          dataXmindConfig: JSON.stringify(config),
        },
        children: [],
      };

      // Skip traversing children of the newly replaced element
      return [SKIP, index + 1];
    });

    if (!hasElixirMind || !useCdn) {
      return;
    }

    const styleNode = {
      type: "element",
      tagName: "link",
      properties: {
        rel: "stylesheet",
        href: "https://esm.sh/mind-elixir/style",
      },
      children: [],
    };

    const scriptNode = {
      type: "element",
      tagName: "script",
      properties: {
        type: "module",
        dataEngine: "zikojs, rehype, mind-elixir",
        src: "https://esm.sh/rehype-mind-elixir@latest/client",
      },
      children: [],
    };

    if (headNode) headNode.children.push(styleNode);
    else tree.children.unshift(styleNode);
    
    if (bodyNode) bodyNode.children.push(scriptNode);
    else tree.children.push(scriptNode);
  };
};

export default rehypeMindElixir;