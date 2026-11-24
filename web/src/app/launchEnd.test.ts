import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { endLaunchOnFirstDraw } from './launchEnd.ts'
import { mountApp } from './mountApp.ts'

// The launch view (index.html's #launch) goes from the DOM once the app draws, and nothing it leaves stays outside
// #root (bridge-workbench's conditions: no full-screen layer over the app, R57).
let unmount: (() => void) | undefined
let container: HTMLElement | undefined

afterEach(() => {
  unmount?.()
  unmount = undefined
  container?.remove()
  container = undefined
  document.getElementById('launch')?.remove()
  for (const style of styles.splice(0)) style.remove()
})

const styles: HTMLStyleElement[] = []

/** Adds index.html's own launch style, and `extra` after it. */
function addLaunchStyle(extra = '') {
  const source = /<style id="launch-style">([\s\S]*?)<\/style>/.exec(indexHtml)?.[1]
  if (source === undefined) throw new Error('no launch style in index.html')
  const style = document.createElement('style')
  style.textContent = source + extra
  document.head.append(style)
  styles.push(style)
}

function addLaunch() {
  const launch = document.createElement('div')
  launch.id = 'launch'
  document.body.prepend(launch)
}

const frame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve()
    })
  })

describe('the launch view', () => {
  it('goes from the DOM after the app mounts, and leaves nothing in body but the app', async () => {
    const before = [...document.body.children]
    addLaunch()
    container = document.createElement('div')
    document.body.append(container)
    const root = createRootRoute()
    const home = createRoute({
      getParentRoute: () => root,
      path: '/',
      component: () => createElement('p', null, 'home'),
    })
    const router = createRouter({
      routeTree: root.addChildren([home]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    unmount = mountApp(container, { router, events: new EventTarget(), push: false })
    await expect.poll(() => document.getElementById('launch')).toBeNull()
    expect(container.textContent).toContain('home')
    expect([...document.body.children]).toEqual([...before, container])
  })

  it('fades out, taking no tap from the start of the fade, then goes from the DOM (R66)', async () => {
    addLaunchStyle()
    addLaunch()
    container = document.createElement('div')
    document.body.append(container)
    unmount = endLaunchOnFirstDraw(container)
    container.append(document.createElement('main'))
    await frame()
    await frame()
    const launch = document.getElementById('launch')
    if (launch === null) throw new Error('the launch view went before its fade')
    expect(launch.hasAttribute('data-leaving')).toBe(true)
    expect(getComputedStyle(launch).pointerEvents).toBe('none')
    await expect.poll(() => document.getElementById('launch')).toBeNull()
  })

  it('goes at once when the style has no fade, as with reduced motion', async () => {
    addLaunchStyle('#launch[data-leaving] { transition: none; }')
    addLaunch()
    container = document.createElement('div')
    document.body.append(container)
    unmount = endLaunchOnFirstDraw(container)
    container.append(document.createElement('main'))
    await frame()
    await frame()
    expect(document.getElementById('launch')).toBeNull()
  })

  it('stays while the app has drawn nothing', async () => {
    addLaunch()
    container = document.createElement('div')
    document.body.append(container)
    unmount = endLaunchOnFirstDraw(container)
    await frame()
    await frame()
    expect(document.getElementById('launch')).not.toBeNull()
    container.append(document.createElement('main'))
    await expect.poll(() => document.getElementById('launch')).toBeNull()
  })
})
