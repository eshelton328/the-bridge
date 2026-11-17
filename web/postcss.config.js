// Panda's PostCSS plugin generates the CSS each file uses. It looks for
// panda.config.ts from the working folder, so name this folder: Vitest and
// ESLint run from the repository root.
export default {
  plugins: {
    '@pandacss/dev/postcss': { cwd: import.meta.dirname, configPath: `${import.meta.dirname}/panda.config.ts` },
  },
}
