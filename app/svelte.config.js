import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';

const config = {
  preprocess: preprocess(),

  kit: {
    adapter: adapter(),
    prerender: {
      default: true,
    },
  },

  // Fix https://stackoverflow.com/questions/74974066/visible-non-interactive-elements-with-an-onclick-event-must-be-accompanied-by
  onwarn: (warning, handler) => {
    if (warning.code === 'a11y-click-events-have-key-events') return;
    handler(warning);
  },
};

export default config;
