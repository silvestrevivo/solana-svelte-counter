<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Wallet } from '@solana/wallet-adapter-wallets';

	export let localStorageKey: string, wallets: Wallet[];

	let initWallet, destroyAdapter;

	onMount(async () => {
		const module = await import('$utils/useWallet');
		initWallet = module.initWallet;
		destroyAdapter = module.destroyAdapter;
	});

	$: initWallet && wallets && initWallet({ wallets, autoConnect: true, localStorageKey });

	onDestroy(() => destroyAdapter && destroyAdapter());
</script>

<svelte:head>
	<script>
		window.global = window;
	</script>
</svelte:head>
