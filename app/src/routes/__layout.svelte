<script lang="ts">
  import { onMount } from 'svelte';
  import { clusterApiUrl } from '@solana/web3.js';
  import { WalletProvider } from '@svelte-on-solana/wallet-adapter-ui';
  import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
  import idl from '../../../target/idl/solana_svelte_counter.json';
  //...
  import { walletStore } from '@svelte-on-solana/wallet-adapter-core';

  const localStorageKey = 'walletAdapter';
  const network = clusterApiUrl('devnet');

  let wallets;

  onMount(async () => {
    const {
      PhantomWalletAdapter,
      SlopeWalletAdapter,
      SolflareWalletAdapter,
      SolletExtensionWalletAdapter,
      TorusWalletAdapter,
    } = await import('@solana/wallet-adapter-wallets');

    const walletsMap = [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new TorusWalletAdapter(),
    ];

    wallets = walletsMap;
  });

  $: ({ connect, select } = $walletStore);

  async function connectWallet() {
    await select(wallets[4].name);
    await connect();
  }
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<AnchorConnectionProvider {network} {idl} />
<button on:click={connectWallet}>connect wallet</button>
<div>
  <slot />
</div>
