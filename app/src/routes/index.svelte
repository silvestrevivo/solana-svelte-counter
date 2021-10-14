<script lang="ts">
	import { onMount } from 'svelte';
	import { useWorkspace } from '$utils/useWorkspace';

	let useWallet, value;

	onMount(async () => {
		const module = await import('$utils/useWallet');
		useWallet = module.useWallet;
	});

	const selectWallet = (walletName) => {
		$useWallet.select(walletName);
	};

	function showAddress(useWalletStore) {
		const base58 = useWalletStore.publicKey?.toBase58();
		if (!useWalletStore.wallet || !base58) return null;
		return base58.slice(0, 4) + '..' + base58.slice(-4);
	}

	$: address = useWallet && showAddress($useWallet);

	async function createCounter() {
		try {
			/* interact with the program via rpc */
			await $useWorkspace.program.rpc.create({
				accounts: {
					baseAccount: $useWorkspace.baseAccount.publicKey,
					user: $useWorkspace.provider.wallet.publicKey,
					systemProgram: $useWorkspace.systemProgram.programId
				},
				signers: [$useWorkspace.baseAccount]
			});

			const account = await $useWorkspace.program.account.baseAccount.fetch(
				$useWorkspace.baseAccount.publicKey
			);
			console.log('account: ', account);
			value = account.count.toString();
		} catch (err) {
			console.log('Transaction error: ', err);
		}
	}

	async function increment() {
		await $useWorkspace.program.rpc.increment({
			accounts: {
				baseAccount: $useWorkspace.baseAccount.publicKey
			}
		});

		const account = await $useWorkspace.program.account.baseAccount.fetch(
			$useWorkspace.baseAccount.publicKey
		);
		console.log('account: ', account);
		value = account.count.toString();
	}
	$: console.log('value: ', value);
</script>

<div>
	<div class="title">
		<h1>Solana Svelte Counter</h1>
		<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
	</div>

	<div class="wrapper-content">
		{#if $useWallet?.connected}
			<button on:click={() => $useWallet.disconnect('walletAdapter')}>disconnect wallet</button>
		{:else}
			<button on:click={() => selectWallet('Phantom')}>select Phantom</button>
		{/if}
	</div>

	<div class="address">
		<p>My wallet address!!</p>
		{#if address}
			<p>{address}</p>
		{/if}
	</div>

	<div class="wrapper-content">
		{#if value}
			<button on:click={increment}>increment</button>
			<p>Value: {value}</p>
		{:else}
			<button on:click={createCounter}>createCounter</button>
		{/if}
	</div>
</div>

<style>
	.title {
		text-align: center;
	}

	.address {
		position: absolute;
		right: 30px;
		top: 30px;
		border: 1px solid blueviolet;
		border-radius: 5px;
		padding: 10px;
	}

	.wrapper-content {
		border: 1px solid blueviolet;
		border-radius: 5px;
		padding: 10px;
		width: 400px;
		margin: 0 auto;
		text-align: center;
		margin-bottom: 30px;
	}
</style>
