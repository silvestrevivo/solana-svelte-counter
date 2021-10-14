<script context="module">
	console.log(`gloabl server`, globalThis);
</script>

<script lang="ts">
	import Solana from '$lib/Solana.svelte';
	import { onMount } from 'svelte';
	import idl from '../../../target/idl/solana_svelte_counter.json';
	import { Buffer } from 'buffer';
	import process from 'process';

	globalThis.Buffer = Buffer;
	globalThis.process = process;

	const localStorageKey = 'walletAdapter';
	const network = 'http://127.0.0.1:8899';

	let wallets;

	onMount(async () => {
		const {
			getPhantomWallet,
			getBitpieWallet,
			getBloctoWallet,
			getCoin98Wallet,
			getLedgerWallet,
			getMathWallet,
			getSlopeWallet,
			getSolflareWallet,
			getSolflareWebWallet,
			getSolletWallet,
			getSolletExtensionWallet,
			getSolongWallet
		} = await import('@solana/wallet-adapter-wallets');
		const walletsMap = [
			getPhantomWallet(),
			getBitpieWallet(),
			getBloctoWallet(),
			getCoin98Wallet(),
			getLedgerWallet(),
			getMathWallet(),
			getMathWallet(),
			getSlopeWallet(),
			getSolflareWallet(),
			getSolflareWebWallet(),
			getSolletWallet(),
			getSolletExtensionWallet(),
			getSolongWallet()
		];
		wallets = walletsMap;
	});
</script>

<Solana {idl} {localStorageKey} {wallets} {network} />
<div>
	<slot />
</div>
