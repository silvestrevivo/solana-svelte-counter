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
	<div class="wallet-adapter-modal-container">
		<div class="wallet-adapter-modal-wrapper">
			<h1 class="wallet-adapter-modal-title">Connect Wallet</h1>

			<button on:click={() => dispatch('close')} class="wallet-adapter-modal-button-close">
				<svg width="14" height="14">
					<path
						d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z"
					/>
				</svg>
			</button>

			<ul class="wallet-adapter-modal-list">
				{#each $walletConfigStore.wallets as { name, icon }}
					<li>
						<WalletButton on:click={() => connect(name)}>
							{name}

							<svelte:fragment slot="end-icon">
								<WalletIcon wallet={{ name, icon }} />
							</svelte:fragment>
						</WalletButton>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
