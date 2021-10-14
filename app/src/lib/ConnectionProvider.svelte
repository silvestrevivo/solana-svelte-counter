<script lang="ts">
	import { onMount } from 'svelte';
	import { Connection } from '@solana/web3.js';
	import { useWorkspace } from '$utils/useWorkspace';
	import { Program, Provider, web3 } from '@project-serum/anchor';

	export let idl, network: string;

	let useWallet;

	onMount(async () => {
		const module = await import('$utils/useWallet');
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

	$: useWallet && defineProgramAndProvider($useWallet);
</script>
