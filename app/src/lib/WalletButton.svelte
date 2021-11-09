<script lang="ts">
	import { WalletStore, walletStore } from '$utils/walletStore';
	import { WalletName } from '@solana/wallet-adapter-wallets';

	let active = false;
	let copied = false;

	function openDropdown() {
		active = true;
	}

	function disconnect() {
		$walletStore.disconnect();
	}

	function openModal() {
		alert('TODO');
	}

	async function copyAddress() {
		const base58 = $walletStore.publicKey?.toBase58();

		if (!base58) return;
		await navigator.clipboard.writeText(base58);
		copied = true;
		setTimeout(() => (copied = false), 400);
	}

	function showAddress(store: WalletStore) {
		const base58 = store.publicKey?.toBase58();
		if (!store.wallet || !base58) return null;
		return base58.slice(0, 4) + '..' + base58.slice(-4);
	}

	function onButtonClick() {
		if ($walletStore.connected) {
			openDropdown();
			return;
		}

		// TODO: show wallet selection modal
		selectWallet(WalletName.Phantom);
	}

	function selectWallet(walletName: WalletName) {
		$walletStore.select(walletName);
	}

	$: address = showAddress($walletStore);
</script>

<div class="wallet-adapter-dropdown">
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

	<ul
		aria-label="dropdown-list"
		class="wallet-adapter-dropdown-list"
		class:wallet-adapter-dropdown-list-active={active}
		role="menu"
	>
		<li on:click={() => copyAddress()} class="wallet-adapter-dropdown-list-item" role="menuitem">
			{copied ? 'Copied' : 'Copy address'}
		</li>
		<li on:click={() => openModal()} class="wallet-adapter-dropdown-list-item" role="menuitem">
			Connect a different wallet
		</li>
		<li on:click={() => disconnect()} class="wallet-adapter-dropdown-list-item" role="menuitem">
			Disconnect
		</li>
	</ul>
</div>

<style>
	.justify-between {
		justify-content: space-between;
	}
</style>
