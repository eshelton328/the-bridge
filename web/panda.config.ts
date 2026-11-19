import { defineConfig } from '@pandacss/dev'

// The tokens, recipes and conditions come from the component library
// through `designSystem` (Panda v2). The app adds no tokens of its own: a
// value no token has is a gap to raise in the library, never a raw value.
export default defineConfig({
  designSystem: '@eshelton328/component-library-1701',
  preflight: true,
  include: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  exclude: ['./src/**/*.test.{ts,tsx}', './src/**/*.gen.ts'],
  outdir: 'styled-system',
  outExtension: 'js',
  jsxFramework: 'react',
  jsxStyleProps: 'none',
  strictTokens: true,
  strictPropertyValues: true,
  // A token or property value the strict rules reject fails codegen and cssgen (audit G-3).
  validation: 'error',
})
