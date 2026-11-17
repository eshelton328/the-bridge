import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// The canvas bundle: src/design/canvasEntry.ts as an IIFE on window.Bridge,
// written to dist-canvas/bridge.js and bridge.css. The canvas page already
// loads React 18, ReactDOM and the library as globals, so they stay out of
// the bundle. React 18's UMD build has no jsx-runtime module, so that
// import resolves to a shim over window.React.createElement.
const jsxShimId = '\0bridge-jsx-runtime'

const reactGlobals: Plugin = {
  name: 'bridge-react-globals',
  enforce: 'pre',
  resolveId(source) {
    return source === 'react/jsx-runtime' || source === 'react/jsx-dev-runtime' ? jsxShimId : null
  },
  load(id) {
    if (id !== jsxShimId) return null
    return [
      'const React = window.React',
      'const withKey = (props, key) => (key === undefined ? props : { ...props, key })',
      'export const jsx = (type, props, key) => React.createElement(type, withKey(props, key))',
      'export const jsxs = jsx',
      'export const jsxDEV = jsx',
      'export const Fragment = React.Fragment',
    ].join('\n')
  },
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [reactGlobals, react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist-canvas',
    emptyOutDir: true,
    lib: {
      entry: 'src/design/canvasEntry.ts',
      name: 'Bridge',
      formats: ['iife'],
      fileName: () => 'bridge.js',
      cssFileName: 'bridge',
    },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react-dom/client', '@eshelton328/component-library-1701'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOM',
          '@eshelton328/component-library-1701': 'CL1701',
        },
      },
    },
  },
})
