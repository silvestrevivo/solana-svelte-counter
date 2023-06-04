# solana-svelte-counter

**Anchor/SvelteKit** application to demo the Svelte wallet adapter. 

The Anchor application lives in the root of the project. 

The SvelteKit application lives in the `app` folder.

## Anchor Setup

Make sure that you have [installed Solana CLI tools locally](https://docs.solana.com/cli/install-solana-cli-tools).

You need to have Cargo and Rust installed to build the contract. 

First of all, clone the repo and run `npm install` to add all the dependencies to the Anchor application. 

To build and deploy the project locally, run the command:

```
npx anchor localnet
```

This command is going to generate the `idl json` file responsible for communicating with the **RPC** from Solana.

## Frontend setup

Frontend is build with SvelteKit. To run it on `localhost:3000`

```
cd app
npm install
npm run dev
```

## Wallet localhost setup

You will also need to configure your installed wallet to work with localhost. For example, in Solflare:

`⚙️` > `Network` > `Add custom node +` then add `localnet` with the address `http://127.0.0.1:8899`.
