// import type { WalletName } from '@solana/wallet-adapter-wallets';

// export function useLocalStorage(key: string, defaultValue: WalletName | undefined = undefined): WalletName | undefined{
//     const value = localStorage.getItem(key);
//     if (value){
//         try {
//             return value ? JSON.parse(value) as WalletName : defaultValue;
//         } catch (error) {
//             console.warn(error);
//             return defaultValue;
//         }
//     } else if (!value && defaultValue) {
//         try {
//             localStorage.setItem(key, JSON.stringify(defaultValue));
//         } catch (error) {
//             console.error(error);
//         }
//     } else if (value === null) {
//         localStorage.removeItem(key);
//     }
// }

export function getLocalStorage<T>(key: string, defaultValue: T | null = null): T | null {
    const value = localStorage.getItem(key);
    try {
        return value ? (JSON.parse(value) as T) : defaultValue;
    } catch (error) {
        console.warn(error);
        return defaultValue;
    }
}

export function setLocalStorage<T>(key: string, value: T | null = null): void {
    if (value === null) {
        localStorage.removeItem(key);
    } else {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(error);
        }
    }
}
