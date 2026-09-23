<script>
  let deferredPrompt = $state(null)

  $effect(() => {
    const onAvailable = (event) => {
      event.preventDefault()
      deferredPrompt = event
    }
    const onInstalled = () => (deferredPrompt = null)

    window.addEventListener('beforeinstallprompt', onAvailable)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onAvailable)
      window.removeEventListener('appinstalled', onInstalled)
    }
  })

  async function install() {
    await deferredPrompt.prompt()
    deferredPrompt = null
  }
</script>

{#if deferredPrompt}
  <button class="install" onclick={install}>Install</button>
{/if}

<style>
  .install {
    height: var(--control);
    padding: 0 14px;
    font-weight: 700;
    color: var(--accent);
    background: transparent;
    border: 1px solid var(--accent);
    border-radius: 8px;
  }
</style>
