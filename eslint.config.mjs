import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// `next lint` was removed in Next 16 -- linting runs through the ESLint CLI
// (`npm run lint`) against this flat config instead of the old .eslintrc.
export default [
  { ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Spotify Web API payloads are consumed untyped throughout this codebase.
      // Kept as a warning rather than an error so lint stays green while the
      // debt is still visible -- tighten per file as response types get added.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Footer's <audio> syncing legitimately sets state from effects. Flagged by
      // the newer react-hooks rules; downgraded so it surfaces without failing.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]
