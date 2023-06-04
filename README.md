# solana-svelte-counter

**Anchor/SvelteKit** application to demo the Svelte wallet adapter. The Anchor application lives in the `root folder`. In the `app` folder you can find the SvelteKit application.

## Anchor Setup

You need to have Cargo and Rust installed to build the contract. First of all, clone the repo and run `npm install` to add all the dependencies to the Anchor application. 

Make sure that you have installed Solana locally in `localhost`.

Change all the **`devnet`** references to `localhost` in `.svelte` files. 
Change all the **`devnet`** references to `localnet` in `Ahcor.toml`. 

Once that is done, to build and deploy the project locally, run the command:

```
npx anchor localnet
```

This command is going to generate the `idl json` file responsible to communicate with the **rpc** from Solana.

## Frontend setup

Frontend is build with SvelteKit. To run it on `localhost:3000`

```
cd app
npm install
npm run dev
```
