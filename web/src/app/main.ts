// The app's entry: React's root error hooks and the window handlers feed
// the reporter, AppBoundary catches what nothing else does, and the dev
// ErrorTray lists the reports.
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { RouterProvider } from '@tanstack/react-router'
import { createElement, Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppBoundary } from '../errors/AppBoundary.tsx'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { installGlobalHandlers } from '../errors/globalHandlers.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { markApp } from './appMarker.ts'
import { blockPageZoom } from './pageZoom.ts'
import { router } from './router.ts'

const container = document.getElementById('root')
if (container === null) throw new Error('index.html has no #root element')

installGlobalHandlers()
markApp()
blockPageZoom()
createRoot(container, rootErrorOptions).render(
  createElement(
    StrictMode,
    null,
    createElement(
      AppBoundary,
      null,
      createElement(Fragment, null, createElement(RouterProvider, { router }), createElement(ErrorTray)),
    ),
  ),
)
