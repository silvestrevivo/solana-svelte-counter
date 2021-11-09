<script lang="ts">
	import { walletConfigStore } from '$utils/walletStore';
	import { createEventDispatcher } from 'svelte';

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
	<h1>modal visible</h1>
	{#each $walletConfigStore.wallets as { name }}
		<h2 on:click={() => connect(name)}>connect to {name}</h2>
	{/each}
	<p on:click={() => dispatch('close')}>close</p>
</div>
