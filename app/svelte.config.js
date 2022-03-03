import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess(),

  kit: {
    adapter: adapter(),
    vite: {
      adapter: adapter(),
      optimizeDeps: {
        include: ['@project-serum/anchor'],
      },
      resolve: {
        alias: {
          $utils: path.resolve('src/utils/'),
        },
      },
      define: {
        // This makes @project-serum/anchor 's process error not happen since it replaces all instances of process.env.BROWSER with true
        'process.env.BROWSER': true,
      },
    },
  },
};

export default config;
