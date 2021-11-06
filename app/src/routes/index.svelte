<script lang="ts">
	import { workSpace } from '$utils/workSpace';
	import { walletStore, walletConfigStore } from '$utils/walletStore';

	let value;

	$: console.log('walletStore: ', $walletStore);
	$: console.log('workSpace: ', $workSpace);
	$: console.log('walletConfigStore: ', $walletConfigStore);

	const selectWallet = (walletName) => {
		$walletStore.select(walletName);
	};

	function showAddress(store) {
		const base58 = store.publicKey?.toBase58();
		if (!store.wallet || !base58) return null;
		return base58.slice(0, 4) + '..' + base58.slice(-4);
	}

	$: address = walletStore && showAddress($walletStore);

	async function createCounter() {
		try {
			/* interact with the program via rpc */
			await $workSpace.program.rpc.create({
				accounts: {
					baseAccount: $workSpace.baseAccount.publicKey,
					user: $workSpace.provider.wallet.publicKey,
					systemProgram: $workSpace.systemProgram.programId
				},
				signers: [$workSpace.baseAccount]
			});

			const account = await $workSpace.program.account.baseAccount.fetch(
				$workSpace.baseAccount.publicKey
			);
			console.log('account: ', account);
			value = account.count.toString();
		} catch (err) {
			console.log('Transaction error: ', err);
		}
	}

	async function increment() {
		await $workSpace.program.rpc.increment({
			accounts: {
				baseAccount: $workSpace.baseAccount.publicKey
			}
		});

		const account = await $workSpace.program.account.baseAccount.fetch(
			$workSpace.baseAccount.publicKey
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
		{#if $walletStore?.connected}
			<button on:click={() => $walletStore.disconnect()}>disconnect wallet</button>
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
