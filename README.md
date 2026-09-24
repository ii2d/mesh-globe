# mesh-globe

A lightweight, serverless browser-based 3D Earth globe visualizing real-time decentralized WebRTC peer-to-peer mesh connectivity, latency, and geographic distribution using Trystero over Nostr relays.

Deployed at [mesh-globe.ii2d.com](https://mesh-globe.ii2d.com).

## Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) with Runes & TypeScript
- **Bundler & Tooling**: [Vite](https://vite.dev/), [pnpm](https://pnpm.io/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Formatting & Linting**: ESLint, Prettier, Husky, `lint-staged`
- **3D Visualization**: `globe.gl` (Three.js WebGL)
- **Signaling & Mesh**: Trystero over Nostr relays

## Development

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev

# Run unit tests
pnpm test

# Type checking
pnpm run check

# Linting & code style
pnpm run lint
pnpm run format:check

# Production build
pnpm run build
```

## Architecture

See [SPEC.md](./SPEC.md) for full project architecture and data contracts.
