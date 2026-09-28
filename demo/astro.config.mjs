// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import rehypeElixirMind from 'rehype-mind-elixir'
import rehypeGlimpse from 'rehype-glimpse'

// https://astro.build/config
export default defineConfig({
	markdown:{
		processor: unified({
			rehypePlugins: [
				[rehypeElixirMind, {useCdn : true}],
				rehypeGlimpse
			],
		}),
	},
	integrations: [
		starlight({
			
			title: 'Remark plugins',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/zakarialaoui10/remark-plugins' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// { label: 'Example Guide', slug: 'guides/example' },
						{ label: 'Mind Elixir', slug: 'guides/mind-elixir' },
					],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
		}),
	],
});
