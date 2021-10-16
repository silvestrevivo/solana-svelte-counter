<script lang="ts">
	import { onMount } from 'svelte';
	import WalletProvider from '$lib/WalletProvider.svelte';
	import ConnectionProvider from '$lib/ConnectionProvider.svelte';
	import idl from '../../../target/idl/solana_svelte_counter.json';

	const localStorageKey = 'walletAdapter';
	const network = 'http://127.0.0.1:8899';

	let wallets;

	onMount(async () => {
		const { getPhantomWallet } = await import('@solana/wallet-adapter-wallets');
		const walletsMap = [getPhantomWallet()];
		wallets = walletsMap;
	});
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<ConnectionProvider {network} {idl} />
<div>
	<slot />
</div>
