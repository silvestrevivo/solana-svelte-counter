import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
  optimizeDeps: {
    include: ['@project-serum/anchor', '@solana/web3.js'],
  },
  resolve: {
    alias: {
      $utils: path.resolve('src/utils/'),
    },
  },
  define: {
    // This makes @project-serum/anchor 's process error not happen since it replaces all instances of process.env.BROWSER with true
    'process.env.BROWSER': true
  },
};

export default config;
