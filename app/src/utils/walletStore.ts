import type {
    Adapter,
    MessageSignerWalletAdapter,
    MessageSignerWalletAdapterProps,
    SendTransactionOptions,
    SignerWalletAdapter,
    SignerWalletAdapterProps,
	WalletReadyState,
    WalletError,
    WalletName,
} from '@solana/wallet-adapter-base';
import { WalletNotConnectedError, WalletNotReadyError } from '@solana/wallet-adapter-base';
import type { Connection, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import { get, writable } from 'svelte/store';
import { WalletNotSelectedError } from './errors';
import { getLocalStorage, setLocalStorage } from './localStorage';


type ErrorHandler = (error: WalletError) => void;
type WalletConfig = Pick<WalletStore, 'wallets' | 'autoConnect' | 'localStorageKey' | 'onError'>;
type WalletStatus = Pick<WalletStore, 'connected' | 'publicKey'>;

// export interface Wallet {
//     adapter: Adapter;
//     readyState: WalletReadyState;
// }

interface WalletStore {
	// props
    autoConnect: boolean;
    wallets: Adapter[];

	// wallet state
    adapter: Adapter | null;
    connected: boolean;
    connecting: boolean;
    disconnecting: boolean;
    localStorageKey: string;
    onError: ErrorHandler;
    publicKey: PublicKey | null;
    ready: WalletReadyState;
    wallet: Adapter | null;
    walletsByName: Record<WalletName, Adapter>;
    name: WalletName | null;

	// wallet methods
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    select(walletName: WalletName): void;
    sendTransaction(
        transaction: Transaction,
        connection: Connection,
        options?: SendTransactionOptions
    ): Promise<TransactionSignature>;
    signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined;
    signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
    signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
}

export const walletStore = createWalletStore();

function addAdapterEventListeners(adapter: Adapter) {
    const { onError } = get(walletStore);

	adapter.on('readyStateChange', onReadyStateChange);
    adapter.on('connect', onConnect);
    adapter.on('disconnect', onDisconnect);
    adapter.on('error', onError);
}

async function autoConnect() {
    const { adapter } = get(walletStore);

    try {
        walletStore.setConnecting(true);
        await adapter?.connect();
    } catch (error: unknown) {
        // Clear the selected wallet
        walletStore.resetWallet();
        // Don't throw error, but onError will still be called
    } finally {
        walletStore.setConnecting(false);
    }
}

async function connect(): Promise<void> {
    const { connected, connecting, disconnecting, wallet, ready, adapter } = get(walletStore);
    if (connected || connecting || disconnecting) return;

    if (!adapter) throw newError(new WalletNotSelectedError());

    if (!ready) {
        walletStore.resetWallet();

        if (typeof window !== 'undefined') {
            window.open(adapter.url, '_blank');
        }

        throw newError(new WalletNotReadyError());
    }

    try {
        walletStore.setConnecting(true);
        await adapter.connect();
    } catch (error: unknown) {
        walletStore.resetWallet();
        throw error;
    } finally {
        walletStore.setConnecting(false);
    }
}

function createWalletStore() {
    const { subscribe, update } = writable<WalletStore>({
        autoConnect: false,
        wallets: [],
        adapter: null,
        connected: false,
        connecting: false,
        disconnecting: false,
        localStorageKey: 'walletAdapter',
        onError: (error: WalletError) => console.error(error),
        publicKey: null,
        ready: "NotDetected" as WalletReadyState, //?? is this correct?
        wallet: null,
        name: null,
        walletsByName: {},
        connect,
        disconnect,
        select,
        sendTransaction,
        signTransaction: undefined,
        signAllTransactions: undefined,
        signMessage: undefined,
    });

    function updateWalletState(adapter: Adapter | null) {
        updateAdapter(adapter);
        update((store) => ({
            ...store,
            name: adapter?.name || null,
            wallet: adapter,
            // ready: false,
			ready: adapter?.readyState,
            publicKey: adapter?.publicKey || null,
            connected: adapter?.connected || false,
        }));

        // if (!(wallet?.name && adapter)) return;
        if (!adapter) return;

		if (shouldAutoConnect()) {
			autoConnect();
		}

        // Asynchronously update the ready state
        // const waiting = wallet.name;
        // (async function () {
        //     const ready = await adapter.ready();
        //     // If the selected wallet hasn't changed while waiting, update the ready state
        //     if (wallet.name === waiting) {
        //         update((store) => ({
        //             ...store,
        //             ready,
        //         }));

        //         if (shouldAutoConnect()) {
        //             autoConnect();
        //         }
        //     }
        // })();
    }

    function updateWalletName(name: WalletName | null) {
        const { localStorageKey, walletsByName } = get(walletStore);

        const adapter = walletsByName?.[name as WalletName] ?? null;
        // const adapter = wallet && wallet.adapter;

        setLocalStorage(localStorageKey, name);
        updateWalletState(adapter);
    }

    function updateAdapter(adapter: Adapter | null) {
        removeAdapterEventListeners();

        let signTransaction: SignerWalletAdapter['signTransaction'] | undefined = undefined;
        let signAllTransactions: SignerWalletAdapter['signAllTransactions'] | undefined = undefined;
        let signMessage: MessageSignerWalletAdapter['signMessage'] | undefined = undefined;

        if (adapter) {
            // Sign a transaction if the wallet supports it
            if ('signTransaction' in adapter) {
                signTransaction = async function (transaction: Transaction) {
                    const { connected } = get(walletStore);
                    if (!connected) throw newError(new WalletNotConnectedError());
                    return await adapter.signTransaction(transaction);
                };
            }

            // Sign multiple transactions if the wallet supports it
            if ('signAllTransactions' in adapter) {
                signAllTransactions = async function (transactions: Transaction[]) {
                    const { connected } = get(walletStore);
                    if (!connected) throw newError(new WalletNotConnectedError());
                    return await adapter.signAllTransactions(transactions);
                };
            }

            // Sign an arbitrary message if the wallet supports it
            if ('signMessage' in adapter) {
                signMessage = async function (message: Uint8Array) {
                    const { connected } = get(walletStore);
                    if (!connected) throw newError(new WalletNotConnectedError());
                    return await adapter.signMessage(message);
                };
            }

            addAdapterEventListeners(adapter);
        }

        update((store) => ({ ...store, adapter, signTransaction, signAllTransactions, signMessage }));
    }

    return {
        resetWallet: () => updateWalletName(null),
        setConnecting: (connecting: boolean) => update((store) => ({ ...store, connecting })),
        setDisconnecting: (disconnecting: boolean) => update((store) => ({ ...store, disconnecting })),
        setReady: (ready: WalletReadyState) => update((store) => ({ ...store, ready })),
        subscribe,
        updateConfig: (walletConfig: WalletConfig & { walletsByName: Record<WalletName, Adapter> }) =>
            update((store) => ({
                ...store,
                ...walletConfig,
            })),
        updateStatus: (walletStatus: WalletStatus) => update((store) => ({ ...store, ...walletStatus })),
        updateWallet: (walletName: WalletName) => updateWalletName(walletName),
    };
}

async function disconnect(): Promise<void> {
    const { disconnecting, adapter } = get(walletStore);
    if (disconnecting) return;

    if (!adapter) return walletStore.resetWallet();

    try {
        walletStore.setDisconnecting(true);
        await adapter.disconnect();
    } finally {
        walletStore.resetWallet();
        walletStore.setDisconnecting(false);
    }
}

export async function initialize({
    wallets,
    autoConnect = false,
    localStorageKey = 'walletAdapter',
    onError = (error: WalletError) => console.error(error),
}: WalletConfig): Promise<void> {
    const walletsByName = wallets.reduce<Record<WalletName, Adapter>>((walletsByName, wallet) => {
        walletsByName[wallet.name] = wallet;
        return walletsByName;
    }, {});

    walletStore.updateConfig({
        wallets,
        walletsByName,
        autoConnect,
        localStorageKey,
        onError,
    });

    const walletName = getLocalStorage<WalletName>(localStorageKey);

    if (walletName) {
        walletStore.updateWallet(walletName);
    }
}

function newError(error: WalletError): WalletError {
    const { onError } = get(walletStore);
    onError(error);
    return error;
}

function onConnect() {
    const { adapter } = get(walletStore);
    if (!adapter) return;

    walletStore.updateStatus({
        publicKey: adapter.publicKey,
        connected: adapter.connected,
    });
}

function onDisconnect() {
    walletStore.resetWallet();
}

function onReadyStateChange() {
	const { adapter } = get(walletStore);
	if (!adapter) return;
	walletStore.updateStatus({
		ready: adapter.readyState
	})
}

function removeAdapterEventListeners(): void {
    const { adapter, onError } = get(walletStore);
    if (!adapter) return;

	adapter.off('readyStateChange', onReadyStateChange);
    adapter.off('connect', onConnect);
    adapter.off('disconnect', onDisconnect);
    adapter.off('error', onError);
}

async function select(walletName: WalletName): Promise<void> {
    const { name, adapter } = get(walletStore);
    if (name === walletName) return;

    if (adapter) await disconnect();

    walletStore.updateWallet(walletName);
}

async function sendTransaction(
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
): Promise<TransactionSignature> {
    const { connected, adapter } = get(walletStore);
    if (!connected) throw newError(new WalletNotConnectedError());
    if (!adapter) throw newError(new WalletNotSelectedError());

    return await adapter.sendTransaction(transaction, connection, options);
}

function shouldAutoConnect(): boolean {
    const { adapter, autoConnect, ready, connected, connecting } = get(walletStore);

    return !(!autoConnect || !adapter || !ready || connected || connecting);
}

if (typeof window !== 'undefined') {
    // Ensure the adapter listeners are invalidated before refreshing the page.
    window.addEventListener('beforeunload', removeAdapterEventListeners);
}

// import { WalletNotConnectedError, WalletNotReadyError } from '@solana/wallet-adapter-base';
// import type {
// 	MessageSignerWalletAdapter,
// 	MessageSignerWalletAdapterProps,
// 	SendTransactionOptions,
// 	SignerWalletAdapter,
// 	SignerWalletAdapterProps,
// 	WalletError
// } from '@solana/wallet-adapter-base';
// import type { Wallet, WalletName } from '@solana/wallet-adapter-wallets';
// import type { Connection, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
// import { get, writable } from 'svelte/store';
// import { WalletNotSelectedError } from './errors';
// import { getLocalStorage, setLocalStorage } from './localStorage';

// type Adapter = ReturnType<Wallet['adapter']>;
// type WalletDictionary = { [name in WalletName]: Wallet };
// type ErrorHandler = (error: WalletError) => void;

// interface WalletConfigStore {
// 	wallets: Wallet[];
// 	walletsByName: WalletDictionary;
// 	autoConnect: boolean;
// 	localStorageKey: string;
// 	onError: ErrorHandler;
// }

// interface WalletStore {
// 	wallet: Wallet | null;
// 	publicKey: PublicKey | null;
// 	ready: boolean;
// 	connected: boolean;
// 	connecting: boolean;
// 	disconnecting: boolean;

// 	select(walletName: WalletName): void;

// 	connect(): Promise<void>;

// 	disconnect(): Promise<void>;

// 	sendTransaction(
// 		transaction: Transaction,
// 		connection: Connection,
// 		options?: SendTransactionOptions
// 	): Promise<TransactionSignature>;

// 	signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
// 	signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined;
// 	signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
// }

// interface WalletNameStore {
// 	walletName: WalletName | null;
// }

// interface WalletAdapterStore {
// 	adapter: Adapter | null;
// }

// export const walletConfigStore = writable<WalletConfigStore>({
// 	wallets: [],
// 	walletsByName: {} as WalletDictionary,
// 	autoConnect: false,
// 	localStorageKey: 'walletAdapter',
// 	onError: (error: WalletError) => console.error(error)
// });

// export const walletStore = writable<WalletStore>({
// 	wallet: null,
// 	publicKey: null,
// 	ready: false,
// 	connected: false,
// 	connecting: false,
// 	disconnecting: false,

// 	select,
// 	connect,
// 	disconnect,
// 	sendTransaction,
// 	signTransaction: undefined,
// 	signAllTransactions: undefined,
// 	signMessage: undefined
// });

// function createWalletNameStore() {
// 	const { subscribe, set } = writable<WalletNameStore>({
// 		walletName: null
// 	});

// 	function updateWalletName(walletName: WalletName | null) {
// 		const { localStorageKey } = get(walletConfigStore);

// 		set({ walletName });
// 		setLocalStorage(localStorageKey, walletName);
// 	}

// 	return {
// 		subscribe,
// 		updateName: (walletName: WalletName) => updateWalletName(walletName),
// 		reset: () => updateWalletName(null)
// 	};
// }

// export const walletNameStore = createWalletNameStore();

// function createWalletAdapterStore() {
// 	const { subscribe, set } = writable<WalletAdapterStore>({
// 		adapter: null
// 	});

// 	return {
// 		subscribe,
// 		updateAdapter: (adapter: Adapter) => {
// 			// clean up adapter event listeners
// 			cleanup();

// 			// update store
// 			set({ adapter });

// 			if (!adapter) return;
// 			// add event listeners
// 			console.log('*** adding event listeners ***');

// 			const { onError } = get(walletConfigStore);

// 			adapter.on('ready', onReady);
// 			adapter.on('connect', onConnect);
// 			adapter.on('disconnect', onDisconnect);
// 			adapter.on('error', onError);
// 		}
// 	};
// }

// export const walletAdapterStore = createWalletAdapterStore();

// export async function initialize({
// 	wallets,
// 	autoConnect = false,
// 	localStorageKey = 'walletAdapter',
// 	onError = (error: WalletError) => console.error(error)
// }: {
// 	wallets: Wallet[];
// 	autoConnect?: boolean;
// 	localStorageKey: string;
// 	onError?: ErrorHandler;
// }): Promise<void> {
// 	walletConfigStore.set({
// 		wallets,
// 		walletsByName: wallets.reduce((walletsByName, wallet) => {
// 			walletsByName[wallet.name] = wallet;
// 			return walletsByName;
// 		}, {} as WalletDictionary),
// 		autoConnect,
// 		localStorageKey,
// 		onError
// 	});

// 	const walletName = getLocalStorage<WalletName>(localStorageKey);

// 	console.log('*** wallet name: ', walletName);

// 	if (walletName) {
// 		walletNameStore.updateName(walletName);
// 	}
// }

// async function select(newName: WalletName | null): Promise<void> {
// 	const { walletName } = get(walletNameStore);
// 	if (walletName === newName) return;

// 	const { adapter } = get(walletAdapterStore);
// 	if (adapter) await disconnect();

// 	walletNameStore.updateName(newName);
// }

// async function disconnect(): Promise<void> {
// 	const { disconnecting } = get(walletStore);
// 	if (disconnecting) return;

// 	const { adapter } = get(walletAdapterStore);
// 	if (!adapter) {
// 		return walletNameStore.reset();
// 	}

// 	try {
// 		walletStore.update((storeValues: WalletStore) => ({
// 			...storeValues,
// 			disconnecting: true
// 		}));
// 		await adapter.disconnect();
// 	} finally {
// 		walletNameStore.reset();
// 		walletStore.update((storeValues: WalletStore) => ({
// 			...storeValues,
// 			disconnecting: false
// 		}));
// 	}
// }

// async function connect(): Promise<void> {
// 	const { connected, connecting, disconnecting, wallet, ready } = get(walletStore);
// 	if (connected || connecting || disconnecting) return;

// 	const { adapter } = get(walletAdapterStore);
// 	if (!wallet || !adapter) throw newError(new WalletNotSelectedError());

// 	if (!ready) {
// 		walletNameStore.reset();
// 		window.open(wallet.url, '_blank');
// 		throw newError(new WalletNotReadyError());
// 	}

// 	try {
// 		walletStore.update((storeValues: WalletStore) => ({
// 			...storeValues,
// 			connecting: true
// 		}));
// 		await adapter.connect();
// 	} catch (error: unknown) {
// 		walletNameStore.reset();
// 		throw error;
// 	} finally {
// 		walletStore.update((storeValues: WalletStore) => ({
// 			...storeValues,
// 			connecting: false
// 		}));
// 	}
// }

// async function sendTransaction(
// 	transaction: Transaction,
// 	connection: Connection,
// 	options?: SendTransactionOptions
// ): Promise<TransactionSignature> {
// 	const { connected } = get(walletStore);
// 	if (!connected) throw newError(new WalletNotConnectedError());

// 	const { adapter } = get(walletAdapterStore);
// 	if (!adapter) throw newError(new WalletNotSelectedError());

// 	return await adapter.sendTransaction(transaction, connection, options);
// }

// // Handle the adapter events.
// function onReady() {
// 	console.log('wallet ready');
// 	walletStore.update((storeValues: WalletStore) => ({
// 		...storeValues,
// 		ready: true
// 	}));
// }

// function newError(error: WalletError): WalletError {
// 	const { onError } = get(walletConfigStore);
// 	onError(error);
// 	return error;
// }

// function onConnect() {
// 	const { adapter } = get(walletAdapterStore);
// 	const { wallet } = get(walletStore);
// 	if (!adapter || !wallet) return;

// 	console.log('wallet connected');

// 	walletStore.update((storeValues: WalletStore) => ({
// 		...storeValues,
// 		wallet,
// 		ready: adapter.ready,
// 		publicKey: adapter.publicKey,
// 		connected: adapter.connected
// 	}));

// 	walletAdapterStore.updateAdapter(adapter);
// }

// function onDisconnect() {
// 	walletNameStore.reset();
// }

// walletNameStore.subscribe(({ walletName }: { walletName: WalletName | null }) => {
// 	console.log('*** wallet name running ***');

// 	const { walletsByName } = get(walletConfigStore);
// 	const wallet = walletsByName?.[walletName as WalletName] ?? null;
// 	const adapter = wallet?.adapter() ?? null;

// 	walletStore.update((storeValues: WalletStore) => ({
// 		...storeValues,
// 		wallet,
// 		ready: adapter?.ready || false,
// 		publicKey: adapter?.publicKey || null,
// 		connected: adapter?.connected || false
// 	}));

// 	walletAdapterStore.updateAdapter(adapter);
// });

// // watcher for auto-connect
// walletAdapterStore.subscribe(async ({ adapter }: { adapter: Adapter | null }) => {
// 	if (!adapter) return;

// 	const { autoConnect } = get(walletConfigStore);
// 	if (!autoConnect) return;

// 	console.log('*** autoConnect subscriber running ***');

// 	const { ready, connected, connecting } = get(walletStore);
// 	if (!ready || connected || connecting) return;

// 	try {
// 		walletStore.update((storeValues: WalletStore) => ({
// 			...storeValues,
// 			connecting: true
// 		}));
// 		await adapter.connect();
// 	} catch (error: unknown) {
// 		// Clear the selected wallet
// 		walletNameStore.reset();
// 		// Don't throw error, but onError will still be called
// 	} finally {
// 		walletStore.update((storeValues: WalletStore) => ({
// 			...storeValues,
// 			connecting: false
// 		}));
// 	}
// });

// // watcher for signature functions
// walletAdapterStore.subscribe(({ adapter }: { adapter: Adapter | null }) => {
// 	let signTransaction: SignerWalletAdapter['signTransaction'] | undefined = undefined;
// 	let signAllTransactions: SignerWalletAdapter['signAllTransactions'] | undefined = undefined;
// 	let signMessage: MessageSignerWalletAdapter['signMessage'] | undefined = undefined;

// 	if (adapter) {
// 		console.log('*** signature adapter store ***');

// 		// Sign a transaction if the wallet supports it
// 		if ('signTransaction' in adapter) {
// 			signTransaction = async function (transaction: Transaction) {
// 				const { connected } = get(walletStore);
// 				if (!connected) throw newError(new WalletNotConnectedError());
// 				return await adapter.signTransaction(transaction);
// 			};
// 		}

// 		// Sign multiple transactions if the wallet supports it
// 		if ('signAllTransactions' in adapter) {
// 			signAllTransactions = async function (transactions: Transaction[]) {
// 				const { connected } = get(walletStore);
// 				if (!connected) throw newError(new WalletNotConnectedError());
// 				return await adapter.signAllTransactions(transactions);
// 			};
// 		}

// 		// Sign an arbitrary message if the wallet supports it
// 		if ('signMessage' in adapter) {
// 			signMessage = async function (message: Uint8Array) {
// 				const { connected } = get(walletStore);
// 				if (!connected) throw newError(new WalletNotConnectedError());
// 				return await adapter.signMessage(message);
// 			};
// 		}
// 	}

// 	walletStore.update((storeValues: WalletStore) => ({
// 		...storeValues,
// 		signTransaction,
// 		signAllTransactions,
// 		signMessage
// 	}));
// });

// function cleanup(): void {
// 	const { adapter } = get(walletAdapterStore);
// 	if (!adapter) return;

// 	console.log('*** cleanup listeners ***');

// 	const { onError } = get(walletConfigStore);

// 	adapter.off('ready', onReady);
// 	adapter.off('connect', onConnect);
// 	adapter.off('disconnect', onDisconnect);
// 	adapter.off('error', onError);
// }

// if (typeof window !== 'undefined') {
// 	// Ensure the adapter listeners are invalidated before refreshing the page.
// 	window.addEventListener('beforeunload', cleanup);
// }

