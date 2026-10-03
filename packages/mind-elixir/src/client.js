import {
  MindMap,
  plainTextToMindNodes
} from '@zikojs/mind-elixir/no-css';

import {
  tags
} from 'ziko/dom';

function initMindMaps() {
  document
    .querySelectorAll('[data-mind-elixir]')
    .forEach((element) => {
      if(element.dataset.rendered) return;

      const body = element.dataset.xmindBody;
      const type = element.dataset.xmindType;
      const config = element.dataset.xmindConfig;

      if(!body) return;

      let nodeData;

      switch (type) {
        case 'json':
        case 'json-like':
          nodeData = JSON.parse(body);
          break;

        case 'plain-text':
          nodeData = plainTextToMindNodes(body);
          break;

        default:
          console.warn(
            'Unknown mind-elixir body type:',
            type
          );
          return;
      }

      const nodeConfig = config
        ? JSON.parse(config)
        : {};

      const map = MindMap({
        height: '400px',
        width: '300px',
        data: nodeData,
        ...nodeConfig,
      });

      element.dataset.rendered = 'true';

      tags
        .div({}, map)
        .style({
          display: 'flex',
          justifyContent: 'center',
          border: '1px darkblue solid',
        })
        .mount(element);
    });
}

if(document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    initMindMaps
  );
} else {
  initMindMaps();
}