<script lang="ts">
  import { walletStore } from '$utils/walletStore';
  import WalletButton from "./WalletButton.svelte";

  const selectWallet = (walletName) => {
		$walletStore.select(walletName);
	};

</script>

<WalletButton on:click={() => selectWallet('Phantom')}>
  Select Wallet
</WalletButton>
