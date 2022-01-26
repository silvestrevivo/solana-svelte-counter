<script lang="ts">
  import { onMount } from 'svelte';
  import { clusterApiUrl } from '@solana/web3.js';
  import WalletProvider from '$lib/WalletProvider.svelte';
  import AnchorConnectionProvider from '$lib/AnchorConnectionProvider.svelte';
  import idl from '../../../target/idl/solana_svelte_counter.json';
  import '../styles/styles.css';

  const localStorageKey = 'walletAdapter';
  const network = clusterApiUrl('devnet');

  let wallets;

  onMount(async () => {
    const {
      PhantomWalletAdapter,
      SlopeWalletAdapter,
      SolflareWalletAdapter,
      SolletExtensionWalletAdapter,
    } = await import('@solana/wallet-adapter-wallets');

    const walletsMap = [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletExtensionWalletAdapter(),
    ];

    wallets = walletsMap;
  });
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<AnchorConnectionProvider {network} {idl} />
<div>
  <slot />
</div>
