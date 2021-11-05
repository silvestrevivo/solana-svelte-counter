<script lang="ts">
	import { onMount } from 'svelte';
	import type { Wallet } from '@solana/wallet-adapter-wallets';
	// import { Buffer } from 'buffer';
	// import process from 'process';

	// globalThis.Buffer = Buffer;
	// globalThis.process = process;

	export let localStorageKey: string,
		wallets: Wallet[],
		autoConnect = false;
	$: console.log('autoConnect: ', autoConnect);

	let initialize;

	onMount(async () => {
		const module = await import('$utils/walletStore');
		initialize = module.initialize;
	});

	$: initialize && wallets && initialize({ wallets, autoConnect, localStorageKey });
</script>

<svelte:head>
	<script>
		window.global = window;
	</script>
</svelte:head>
