import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import { tick } from 'svelte'
import InstallButton from './InstallButton.svelte'

function fireInstallPrompt() {
  const event = new Event('beforeinstallprompt')
  event.prompt = vi.fn().mockResolvedValue()
  window.dispatchEvent(event)
  return event
}

describe('InstallButton', () => {
  it('is hidden until the browser offers installation', () => {
    render(InstallButton)
    expect(screen.queryByRole('button', { name: /install/i })).not.toBeInTheDocument()
  })

  it('appears once the install prompt is available', async () => {
    render(InstallButton)
    fireInstallPrompt()
    expect(await screen.findByRole('button', { name: /install/i })).toBeInTheDocument()
  })

  it('triggers the native prompt when clicked', async () => {
    render(InstallButton)
    const event = fireInstallPrompt()
    await fireEvent.click(await screen.findByRole('button', { name: /install/i }))
    expect(event.prompt).toHaveBeenCalled()
  })

  it('hides itself after installation', async () => {
    render(InstallButton)
    fireInstallPrompt()
    expect(await screen.findByRole('button', { name: /install/i })).toBeInTheDocument()
    window.dispatchEvent(new Event('appinstalled'))
    await tick()
    expect(screen.queryByRole('button', { name: /install/i })).not.toBeInTheDocument()
  })
})
