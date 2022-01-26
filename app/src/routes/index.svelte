<script lang="ts">
  import WalletMultiButton from '$lib/WalletMultiButton.svelte';
  import { walletStore } from '$utils/walletStore';
  import { workSpace } from '$utils/workSpace';

  let value;

  async function createCounter() {
    try {
      /* interact with the program via rpc */
      await $workSpace.program.rpc.create({
        accounts: {
          baseAccount: $workSpace.baseAccount.publicKey,
          user: $workSpace.provider.wallet.publicKey,
          systemProgram: $workSpace.systemProgram.programId,
        },
        signers: [$workSpace.baseAccount],
      });

      const account = await $workSpace.program.account.baseAccount.fetch(
        $workSpace.baseAccount.publicKey,
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
        baseAccount: $workSpace.baseAccount.publicKey,
      },
    });

    const account = await $workSpace.program.account.baseAccount.fetch(
      $workSpace.baseAccount.publicKey,
    );
    console.log('account: ', account);
    value = account.count.toString();
  }
</script>

<div class="wrapper-app">
  <div class="title">
    <h1>Solana Svelte Counter</h1>
    <p>
      Demo for <a href="https://github.com/solana-labs/wallet-adapter"
        >solana-labs/wallet-adapter</a
      >, for adapter implementation in Svelte
    </p>
  </div>

  <div class="address">
    <WalletMultiButton />
  </div>

  <div class="wrapper-content">
    {#if value}
      <button on:click={increment}>Increment</button>
      <p class="value">Value: {value}</p>
    {:else}
      <button on:click={createCounter}>Create counter</button>
    {/if}
  </div>

  {#if $walletStore?.connected}
    <p class="warning">You are connected to DevNet!</p>
  {:else}
    <p class="warning">You are not connected...</p>
  {/if}
</div>

<style>
  :global(body) {
    padding: 0;
    margin: 0;
  }
  .wrapper-app {
    height: 100vh;
    font-family: 'Inter', 'Roboto', 'Helvetica Neue', Helvetica, Arial,
      sans-serif;
  }
  .title {
    text-align: center;
  }

  .address {
    position: absolute;
    right: 30px;
    top: 30px;
    border-radius: 5px;
    padding: 10px;
  }

  .wrapper-content {
    border: 2px solid rgb(226, 153, 43);
    border-radius: 5px;
    padding: 50px;
    width: 400px;
    margin: 0 auto;
    text-align: center;
    margin-bottom: 30px;
  }

  button {
    border: 1px solid grey;
    padding: 10px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
  }

  .value {
    font-size: 30px;
  }

  .warning {
    color: grey;
    text-align: center;
  }
</style>
