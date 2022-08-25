<script lang="ts">
  import { onMount } from 'svelte';
  import { clusterApiUrl } from '@solana/web3.js';
  import { WalletProvider } from '@svelte-on-solana/wallet-adapter-ui';
  // import WalletProvider from '$lib/ui/WalletProvider.svelte';
  import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
  // import AnchorConnectionProvider from '$lib/ui/AnchorConnectionProvider.svelte';
  import idl from '../../../target/idl/solana_svelte_counter.json';

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
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<AnchorConnectionProvider {network} {idl} />
<div>
  <slot />
</div>
