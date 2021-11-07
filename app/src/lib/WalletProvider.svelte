<script context="module" lang="ts">
	import { Buffer } from 'buffer';
	import process from 'process';

	globalThis.Buffer = Buffer;
	globalThis.process = process;
</script>

<script lang="ts">
	import type { Wallet } from '@solana/wallet-adapter-wallets';
	import { initialize } from '$utils/walletStore';

	export let localStorageKey: string,
		wallets: Wallet[],
		autoConnect = false;

	initialize({ wallets, autoConnect, localStorageKey });
</script>

<svelte:head>
	<script>
		window.global = window;
	</script>
</svelte:head>
