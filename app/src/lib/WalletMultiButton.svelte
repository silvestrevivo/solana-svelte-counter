<script lang="ts">
	import { walletStore } from '$utils/walletStore';
	import WalletConnectButton from './WalletConnectButton.svelte';
	import WalletModalButton from './WalletModalButton.svelte';
	import WalletButton from './WalletButton.svelte';
	import WalletIcon from './WalletIcon.svelte';
	import WalletModal from './WalletModal.svelte';

	$: ({ publicKey, wallet, disconnect, connect, select } = $walletStore);

	let dropDrownVisible = false,
		modalVisible = false,
		active = false,
		copied = false;

	$: base58 = publicKey && publicKey?.toBase58();
	$: content = showAddressContent($walletStore);

	const copyAddress = async () => {
		if (!base58) return;
		await navigator.clipboard.writeText(base58);
		copied = true;
		setTimeout(() => (copied = false), 400);
	};

	const openDropdown = () => (dropDrownVisible = true);
	const closeDropdown = () => (dropDrownVisible = false);
	const openModal = () => {
		modalVisible = true;
		closeDropdown();
	};
	const closeModal = () => (modalVisible = false);

	function showAddressContent(store) {
		const base58 = store.publicKey?.toBase58();
		if (!store.wallet || !base58) return null;
		return base58.slice(0, 4) + '..' + base58.slice(-4);
	}

	async function connectWallet(event) {
		closeModal();
		await select(event.detail);
		await connect();
	}
</script>

{#if !wallet}
	<WalletModalButton on:click={openModal} />
{:else if !base58}
	<WalletConnectButton />
{:else}
	<div class="wallet-adapter-dropdown">
		<WalletButton on:click={openDropdown} class="wallet-adapter-button-trigger">
			<svelte:fragment slot="start-icon">
				<WalletIcon {wallet} />
			</svelte:fragment>
			{content}
		</WalletButton>
		{#if dropDrownVisible}
			<ul
				aria-label="dropdown-list"
				class="wallet-adapter-dropdown-list wallet-adapter-dropdown-list-active"
				role="menu"
			>
				<li on:click={copyAddress} class="wallet-adapter-dropdown-list-item" role="menuitem">
					{copied ? 'Copied' : 'Copy address'}
				</li>
				<li on:click={openModal} class="wallet-adapter-dropdown-list-item" role="menuitem">
					Connect a different wallet
				</li>
				<li on:click={disconnect} class="wallet-adapter-dropdown-list-item" role="menuitem">
					Disconnect
				</li>
			</ul>
		{/if}
	</div>
{/if}

{#if modalVisible}
	<WalletModal on:close={closeModal} on:connect={connectWallet} />
{/if}
