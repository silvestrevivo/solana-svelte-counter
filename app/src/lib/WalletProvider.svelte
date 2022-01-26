<!-- <script context="module" lang="ts">
	import { Buffer } from 'buffer';
	import process from 'process';

	globalThis.Buffer = Buffer;
	globalThis.process = process;

	if (typeof window !== 'undefined') {
		window.global = window;
	}
</script> -->
<script lang="ts">
	// import type { Wallet } from '$utils/walletStore';
	import type { Adapter } from '@solana/wallet-adapter-base';
	import { initialize } from '$utils/walletStore';
	import type { WalletError } from '@solana/wallet-adapter-base';

	export let localStorageKey: string,
		wallets: Adapter[],
		autoConnect = false,
		onError = (error: WalletError) => console.error(error);

	$: wallets && initialize({ wallets, autoConnect, localStorageKey, onError });
</script>

<svelte:head>
	<script>
		window.global = window;
	</script>
</svelte:head>
