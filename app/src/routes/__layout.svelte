<script lang="ts">
	import Solana from '$lib/Solana.svelte';
	import { onMount } from 'svelte';
	import idl from '../../../target/idl/solana_svelte_counter.json';

	const localStorageKey = 'walletAdapter';

	let wallets;

	onMount(async () => {
		const { Buffer } = await import('buffer');
		const process = await import('process');
		window.Buffer = Buffer;
		window.process = process;
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

<Solana {idl} {localStorageKey} {wallets} network="http://localhost:8899"/>
<div>
	<slot />
</div>

<style>
	div {
		border: 1px solid blueviolet;
	}
</style>
