<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
	import { useWorkspace } from '$utils/useWorkspace';
	import { Program, Provider, web3 } from '@project-serum/anchor';
	import type { useWalletStoreT, useWalletMethods } from '$utils/useWallet';

	export let idl, localStorageKey: string, wallets: unknown[], network: string;

	let useWalletStore,
		useWalletNameStore,
		useWalletAdapterStore,
		watchWalletNameClient,
		watchAdapterClient,
		destroyAdapterClient,
		autoConnectWalletClient,
		initWalletClient;

	onMount(async () => {
		const {
			useWallet,
			useWalletName,
			useWalletAdapter,
			initWallet,
			watchWalletName,
			watchAdapter,
			destroyAdapter,
			autoConnectWallet
		} = await import('../utils/useWallet');

		useWalletStore = useWallet;
		useWalletNameStore = useWalletName;
		useWalletAdapterStore = useWalletAdapter;
		initWalletClient = initWallet;
		watchWalletNameClient = watchWalletName;
		watchAdapterClient = watchAdapter;
		destroyAdapterClient = destroyAdapter;
		autoConnectWalletClient = autoConnectWallet;
	});

	$: wallets &&
		initWalletClient &&
		initWalletClient({ wallets, autoConnect: true, localStorageKey });

	$: useWalletStore &&
		defineProgramAndProvider($useWalletStore as useWalletStoreT | useWalletMethods);

	const programID = new PublicKey(idl.metadata.address);
	const baseAccount = web3.Keypair.generate();
	const systemProgram = web3.SystemProgram;
	const connection = new Connection(network, 'processed');

	function defineProgramAndProvider(useWalletStore) {
		if (useWalletStore?.publicKey) {
			let { sendTransaction, signTransaction, signAllTransactions, signMessage, publicKey } =
				useWalletStore;
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

	$: watchWalletNameClient &&
		watchWalletNameClient($useWalletNameStore.walletName, localStorageKey);
	$: watchAdapterClient && watchAdapterClient($useWalletAdapterStore.adapter);
	$: autoConnectWalletClient &&
		autoConnectWalletClient({
			adapter: $useWalletAdapterStore.adapter,
			walletName: $useWalletNameStore.walletName
		});

	onDestroy(() => {
		if ($useWalletAdapterStore?.adapter) {
			destroyAdapterClient($useWalletAdapterStore.adapter);
		}
	});
</script>

<svelte:head>
	<script>
		window.global = window;
	</script>
</svelte:head>
