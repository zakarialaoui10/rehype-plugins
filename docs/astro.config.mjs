// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';

import rehypeMindElixir from 'rehype-mind-elixir';
import rehypeGlimpse from 'rehype-glimpse';

import vercel from '@astrojs/vercel';
import starlightThemeMdbook from 'starlight-theme-mdbook';


export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: [
        [rehypeMindElixir, { useCdn: true }],
        rehypeGlimpse,
      ],
    }),
  },
  adapter: vercel(),
  integrations: [
    starlight({
      title: 'Rehype plugins',
      plugins: [starlightThemeMdbook()],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/zakarialaoui10/remark-plugins',
        },
      ],

      sidebar: [
		{
          label: 'Guides',
          items: [
            {
              autogenerate: {
                directory: 'guides',
              },
            },
          ],
        }
      ],
    }),
  ],
});