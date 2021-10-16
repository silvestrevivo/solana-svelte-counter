<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Wallet } from '@solana/wallet-adapter-wallets';
	import { Buffer } from 'buffer';
	import process from 'process';

	globalThis.Buffer = Buffer;
	globalThis.process = process;

	export let localStorageKey: string,
		wallets: Wallet[],
		autoConnect = false;

	let initWallet, destroyAdapter;

	onMount(async () => {
		const module = await import('$utils/useWallet');
		initWallet = module.initWallet;
		destroyAdapter = module.destroyAdapter;
	});

	$: initWallet && wallets && initWallet({ wallets, autoConnect, localStorageKey });

	onDestroy(() => destroyAdapter && destroyAdapter());
</script>

<svelte:head>
	<script>
		window.global = window;
	</script>
</svelte:head>
