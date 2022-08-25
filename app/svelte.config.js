import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';

const config = {
  preprocess: preprocess(),

	kit: {
		adapter: adapter(),
    prerender: {
      default: true
    },
  },
};

export default config;
