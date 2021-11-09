<script lang="ts">
	import { walletStore } from '$utils/walletStore';
	import WalletButton from './WalletButton.svelte';
	import WalletIcon from './WalletIcon.svelte';

	const { wallet, connect, connecting, connected } = $walletStore;

	export let disabled: boolean = false;

	let content;

	$: {
		if (connecting) content = 'Connecting ...';
		if (connected) content = 'Connected';
		if (wallet) content = 'Connect';
		content = 'Connect Wallet';
	}

	function handleClick(e: MouseEvent) {
		connect().catch(() => {});
	}
</script>

<WalletButton
	on:click={handleClick}
	disabled={disabled || !wallet || connecting || connected}
	class="wallet-adapter-button-trigger"
>
	<svelte:fragment slot="start-icon">
		{#if wallet}
			<WalletIcon {wallet} />
		{/if}
	</svelte:fragment>
	{content}
</WalletButton>
