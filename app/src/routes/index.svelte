<script lang="ts">
  import { WalletMultiButton } from '@svelte-on-solana/wallet-adapter-ui';
  import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
  import { workSpace } from '$utils/workSpace';
  import { fly } from 'svelte/transition';

  let value;

  $: console.log('value: ', value);

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
    value = account.count.toString();
  }
</script>

<div class="wrapper-app">
  <div class="title">
    <h1>Solana Svelte Counter</h1>
    <p>
      Demo of <a href="https://github.com/solana-labs/wallet-adapter"
        >svelte-on-solana/wallet-adapter</a
      >, for implementation in Svelte of the <strong>wallet adapter</strong>
    </p>
  </div>

  <div class="address">
    <WalletMultiButton />
  </div>

  {#if $walletStore?.connected}
    <div class="wrapper-content">
      {#if value}
        <button on:click={increment}>Increment</button>
        <p class="value">
          Value:
          {#key value}
            <span
              in:fly={{ duration: 500, y: -100 }}
              out:fly={{ duration: 500, y: 100 }}>{value}</span
            >
          {/key}
        </p>
      {:else}
        <button on:click={createCounter}>Create counter</button>
      {/if}
    </div>
    <p class="warning">You are connected to DevNet!</p>
  {:else}
    <p class="warning">You are not connected...</p>
  {/if}
</div>

<style>
  :global(body) {
    padding: 100px;
    margin: 0;
    background-color: #333333;
  }
  .wrapper-app {
    height: 100vh;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
  }
  .title {
    text-align: center;
    color: white;
    font-size: 20px;
    margin-bottom: 40px;
  }

  a {
    color: #676796;
  }

  .address {
    position: absolute;
    right: 30px;
    top: 30px;
    border-radius: 5px;
    padding: 10px;
  }

  .wrapper-content {
    border-radius: 5px;
    padding: 50px;
    width: 400px;
    margin: 0 auto;
    text-align: center;
    margin-bottom: 30px;
  }

  button {
    border: none;
    padding: 16px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    color: white;
    background-color: #4e44ce;
  }

  .value {
    font-size: 40px;
    padding: 25px;
    color: white;
  }

  .warning {
    color: #ca4b4b;
    text-align: center;
    padding: 40px;
    font-size: 20px;
  }
</style>
