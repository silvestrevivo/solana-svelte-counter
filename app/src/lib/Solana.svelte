<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Connection } from '@solana/web3.js';
	import { useWorkspace } from '$utils/useWorkspace';
	import { Program, Provider, web3 } from '@project-serum/anchor';
	import type { Wallet } from '@solana/wallet-adapter-wallets';

	export let idl, localStorageKey: string, wallets: Wallet[], network: string;

	let initWallet, destroyAdapter, useWallet;

	onMount(async () => {
		const module = await import('$utils/useWallet');
		initWallet = module.initWallet;
		destroyAdapter = module.destroyAdapter;
		useWallet = module.useWallet;
	});

	const { PublicKey } = web3;
	const programID = new PublicKey(idl.metadata.address);
	const baseAccount = web3.Keypair.generate();
	const systemProgram = web3.SystemProgram;
	const connection = new Connection(network, 'processed');

	function defineProgramAndProvider(useWallet) {
		if (useWallet?.publicKey) {
			let { sendTransaction, signTransaction, signAllTransactions, signMessage, publicKey } =
				useWallet;
			const providerWallet = {
				sendTransaction,
				signTransaction,
				signAllTransactions,
				signMessage,
				publicKey
			};
			const provider = new Provider(connection, providerWallet, {
				preflightCommitment: 'processed'
			});
			const program = new Program(idl, programID, provider);
			useWorkspace.set({ baseAccount, connection, provider, program, systemProgram });
		}
	}

	$: initWallet && wallets && initWallet({ wallets, autoConnect: true, localStorageKey });
	$: initWallet && defineProgramAndProvider($useWallet);

	onDestroy(() => destroyAdapter && destroyAdapter());
</script>
