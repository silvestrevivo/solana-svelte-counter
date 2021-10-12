<script lang="ts">
	import { onMount } from 'svelte';
	import { useWorkspace } from '$utils/useWorkspace';

	let useWalletStore, value;
	$: console.log('value: ', value);

	onMount(async () => {
		const { useWallet } = await import('../utils/useWallet');
		useWalletStore = useWallet;
	});

	const selectWallet = (walletName) => {
		$useWalletStore.select(walletName);
	};

	function showAddress(useWalletStore) {
		const base58 = useWalletStore.publicKey?.toBase58();
		if (!useWalletStore.wallet || !base58) return null;
		return base58.slice(0, 4) + '..' + base58.slice(-4);
	}

	$: address = $useWalletStore && showAddress($useWalletStore);

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
</script>

<div>
	<h1>Welcome to SvelteKit</h1>
	<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

	<button on:click={() => selectWallet('Phantom')}>select Phantom</button>
	<button on:click={() => $useWalletStore.disconnect('walletAdapter')}>disconnect wallet</button>

	<p>My wallet address!!</p>
	{#if address}
		<p>{address}</p>
	{/if}

	<button on:click={createCounter}>createCounter</button>
	<button on:click={increment}>increment</button>
</div>
