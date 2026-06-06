import '@testing-library/jest-dom/vitest'

if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', () => {})
}
