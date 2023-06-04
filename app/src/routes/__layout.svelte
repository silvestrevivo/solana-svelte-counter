<script lang="ts">
  import { onMount } from 'svelte';
  import { WalletProvider } from '@svelte-on-solana/wallet-adapter-ui';
  import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
  import idl from '../../../target/idl/solana_svelte_counter.json';

  const localStorageKey = 'walletAdapter';
  const network = 'http://localhot:8899';

  let wallets;

  onMount(async () => {
    const {
      PhantomWalletAdapter,
      SolflareWalletAdapter,
      SolletExtensionWalletAdapter,
      TorusWalletAdapter,
    } = await import('@solana/wallet-adapter-wallets');

    const walletsMap = [
      new PhantomWalletAdapter(),
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
