import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import path from 'path';
// import inject from '@rollup/plugin-inject';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter(),
		target: '#svelte',
		vite: {
			// adapter: adapter(),
      resolve: {
        alias: {
          $utils: path.resolve('src/utils/'),
        },
      },
			define: {
        // This makes @project-serum/anchor 's process error not happen since it replaces all instances of process.env.BROWSER with true
        'process.env.BROWSER': true
      },
      // plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],

      // build: {
      //   rollupOptions: {
      //     plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
      //   }
      // },
    },
	}
};

export default config;
