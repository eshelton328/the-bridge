# app

The app's start: `main.ts` installs the global error handlers, creates
the React root with the root error hooks (`errors/rootErrorOptions.ts`)
and renders `AppBoundary` > `RouterProvider` and the dev `ErrorTray`.

- `router.ts`: the router, with `RouteError` and `NotFound` as the
  default error and not-found components, so no route needs a boundary
  of its own (d-084).
- `routeTree.gen.ts`: generated from `routes/` by `pnpm gen:routes`. Never
  edit it; `pnpm check:routes` fails when it is stale.
- `appMarker.ts`: `main.ts` calls `markApp()` before the first render,
  which sets `data-app` on `<html>`. See "No page bounce, no page zoom"
  below.
- `pageZoom.ts`: on iOS, `main.ts` calls `blockPageZoom()` before the
  first render. See "No page bounce, no page zoom" below.

Only this folder and page entries read stores.

## No page bounce, no page zoom

Erik's decision (2026-11-18): in the installed app, the page never pulls
past the screen and bounces, and the page never zooms, on any platform.
Before it, tapping the Inbox search on iOS zoomed the page (iOS Safari
zooms to a focused field whose font is under 16 px, and the app keeps the
Figma sizes), and a pinch on the Toolkit map zoomed the whole app.

- `src/index.css`: under `html[data-app]`, html and body fill the window
  with `overflow: hidden` and `overscroll-behavior: none`, so the document
  never scrolls and only the shell's own scroll areas do. `touch-action:
  pan-x pan-y` on html stops a pinch and a double tap from zooming the
  page. Only the running app sets `data-app` (`markApp()` in
  `appMarker.ts`). Storybook and the fidelity screenshots load
  `index.css` without it, so a story taller than its frame (Inbox >
  Screens > The list, 1158 px tall in a 982 px frame) still scrolls the
  document. `DocumentScroll.test.tsx` calls `markApp()` for the locked
  case and checks that the document scrolls without it.
- `index.html`: the viewport meta sets `maximum-scale=1,
  user-scalable=no` for every platform.
- `pageZoom.ts`: iOS Safari ignores `user-scalable=no`, so on iOS (and
  iPadOS, which reports a Mac with touch points) a non-passive listener
  cancels each `gesturestart` and `gesturechange` on the document. A part
  that zooms itself with a pinch marks itself `data-allow-pinch`, and
  gestures that start inside it go through. The Toolkit phone map's
  window does (MapGraph `zoom`, `ToolkitMapZoom.test.tsx`); before it,
  the map's pinch was the page zoom.

`user-scalable=no` turns off browser zoom, which WCAG 1.4.4 (Resize Text)
asks apps to allow. That is Erik's decision for his own app.
