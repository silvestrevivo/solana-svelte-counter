<script lang="ts">
	import ConnectionProvider from '$lib/ConnectionProvider.svelte';
	import WalletProvider from '$lib/WalletProvider.svelte';
	import { clusterApiUrl } from '@solana/web3.js';
	import { onMount } from 'svelte';
	import idl from '../../../target/idl/solana_svelte_counter.json';
	import '../styles.css';

	const localStorageKey = 'walletAdapter';
	// const network = 'http://127.0.0.1:8899';
	const network = clusterApiUrl('devnet');

	let wallets;

	onMount(async () => {
		const { getPhantomWallet, getSlopeWallet, getSolflareWallet } = await import(
			'@solana/wallet-adapter-wallets'
		);
		const walletsMap = [getPhantomWallet(), getSlopeWallet(), getSolflareWallet()];
		wallets = walletsMap;
	});
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<ConnectionProvider {network} {idl} />
<div>
	<slot />
</div>
