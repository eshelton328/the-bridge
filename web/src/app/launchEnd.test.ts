import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
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
})

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
