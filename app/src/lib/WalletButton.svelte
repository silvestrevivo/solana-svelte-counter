<button class="wallet-adapter-button" class:justify-between={$$slots['start-icon'] || $$slots['end-icon']} on:click>
  {#if $$slots['start-icon']}
     <i class="wallet-adapter-button-start-icon">
         <slot name="start-icon"></slot>
     </i>
  {/if}
  <slot></slot>
  {#if $$slots['end-icon']}
     <i  class="wallet-adapter-button-end-icon">
         <slot name="end-icon"></slot>
     </i>
  {/if}
</button>

<style>
  .justify-between {
    justify-content: space-between;
  }
</style>
