<script lang="ts">
	import { walletConfigStore } from '$utils/walletStore';
	import { createEventDispatcher } from 'svelte';
	import WalletButton from './WalletButton.svelte';
	import WalletIcon from './WalletIcon.svelte';

	const dispatch = createEventDispatcher();

	function connect(name) {
		dispatch('connect', name);
	}
</script>

<div
	aria-labelledby="wallet-adapter-modal-title"
	aria-modal="true"
	class="wallet-adapter-modal wallet-adapter-modal-fade-in"
	role="dialog"
>
	<h1>Connect Wallet</h1>
	{#each $walletConfigStore.wallets as { name, icon }}
		<WalletButton on:click={() => connect(name)}>
			{name}

			<svelte:fragment slot="end-icon">
				<WalletIcon wallet={{ name, icon }} />
			</svelte:fragment>
		</WalletButton>
	{/each}
	<p on:click={() => dispatch('close')}>close</p>
</div>
