<script lang="ts">
	import { onMount } from 'svelte';
	import { Connection } from '@solana/web3.js';
	import { workSpace } from '$utils/workSpace';
	import { Program, Provider, web3 } from '@project-serum/anchor';

	export let idl, network: string;

	let walletStore;

	onMount(async () => {
		const module = await import('$utils/walletStore');
		walletStore = module.walletStore;
	});

	const { PublicKey } = web3;
	const programID = new PublicKey(idl.metadata.address);
	const baseAccount = web3.Keypair.generate();
	const systemProgram = web3.SystemProgram;
	const connection = new Connection(network, 'processed');

	function defineProgramAndProvider(walletStore) {
		let { sendTransaction, signTransaction, signAllTransactions, signMessage, publicKey } =
			walletStore;
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
		workSpace.set({ baseAccount, connection, provider, program, systemProgram });
	}

	$: $walletStore && $walletStore.publicKey && defineProgramAndProvider($walletStore);
</script>
