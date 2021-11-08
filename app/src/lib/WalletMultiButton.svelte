<script lang="ts">
	import { walletStore } from '$utils/walletStore';
	import WalletButton from './WalletButton.svelte';
	import WalletModalButton from './WalletModalButton.svelte';

	function showAddress(store) {
		const base58 = store.publicKey?.toBase58();
		if (!store.wallet || !base58) return null;
		return base58.slice(0, 4) + '..' + base58.slice(-4);
	}

	$: address = walletStore && showAddress($walletStore);
</script>

{#if $walletStore.connected}
	<WalletButton>
		{address}

		<img
			slot="start-icon"
			src={$walletStore.wallet.icon}
			alt={$walletStore.wallet.name + ' icon'}
		/>
	</WalletButton>
{:else}
	<WalletModalButton />
{/if}
