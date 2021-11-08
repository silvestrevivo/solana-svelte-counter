<script lang="ts">
	import { walletStore, WalletStore } from '$utils/walletStore';
	import { WalletName } from '@solana/wallet-adapter-wallets';

	function showAddress(store: WalletStore) {
		const base58 = store.publicKey?.toBase58();
		if (!store.wallet || !base58) return null;
		return base58.slice(0, 4) + '..' + base58.slice(-4);
	}

	function onButtonClick() {
		if ($walletStore.connected) {
			// show list modal

			return;
		}

		// TODO: show wallet selection modal
		selectWallet(WalletName.Phantom);
	}

	const selectWallet = (walletName: WalletName) => {
		$walletStore.select(walletName);
	};

	$: address = showAddress($walletStore);
</script>

<button
	class="wallet-adapter-button"
	class:justify-between={$walletStore.connected}
	on:click={() => onButtonClick()}
>
	{#if $walletStore.connected}
		{address}

		<img src={$walletStore.wallet.icon} alt={$walletStore.wallet.name + ' icon'} />
	{:else}
		Select wallet
	{/if}
</button>

<style>
	.justify-between {
		justify-content: space-between;
	}
</style>
