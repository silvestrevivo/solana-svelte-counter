<script lang="ts">
	// import { walletStore } from '$utils/walletStore';
	import WalletButton from './WalletButton.svelte';
	// const selectWallet = (walletName) => {
	// 	$walletStore.select(walletName);
	// };
</script>

<WalletButton class="wallet-adapter-button-trigger" on:click>Select Wallet</WalletButton>

<!-- <WalletButton on:click={() => selectWallet('Phantom')}>Select Wallet</WalletButton> -->
