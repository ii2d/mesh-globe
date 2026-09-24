# Specification: ii2d/mesh-globe

## Problem Statement

Users and distributed teams lack a lightweight, zero-configuration way to observe real-time peer-to-peer network connectivity, latency, and geographic distribution directly in the browser without relying on centralized coordination servers, accounts, or complex infrastructure.

## Solution

A single-page, browser-based 3D globe visualization (`mesh-globe`) where users automatically connect to each other in a decentralized WebRTC mesh network using Trystero over Nostr relays. The application plots the user's approximate location on a 3D Earth globe, renders animated connection arcs to all active peers, continuously measures round-trip latency via WebRTC data channel heartbeats, and color-codes connection quality alongside an interactive network HUD. The application is completely serverless, deployed to GitHub Pages at `mesh-globe.ii2d.com`, and incorporates automated quality, security, and build-time version tracking.

## User Stories

1. As a visitor, I want the web application to load instantaneously without requiring login, registration, or third-party tracking, so that I can immediately view and participate in the peer mesh.
2. As a visitor, I want to see my geographic location rendered as a distinct marker on a 3D interactive Earth globe, so that I understand my position in the network topology.
3. As a privacy-conscious user, I want my geographic coordinates to be approximated at the city level with a small random jitter rather than exposing my precise GPS coordinates, so that my physical location remains protected on a public P2P mesh.
4. As a visitor, I want my browser to automatically discover and pair with other active visitors using public Nostr relays without requiring custom signaling servers, so that connection establishment is decentralized and resilient.
5. As a visitor, I want to see active peers rendered as distinct nodes on the 3D globe, so that I can visualize where other participants are located globally.
6. As a visitor, I want to see animated 3D arcs drawn between my node and connected peer nodes, so that I have a clear spatial representation of my active WebRTC connections.
7. As a visitor, I want the system to continuously measure round-trip time (RTT) to each connected peer via WebRTC data channel ping/pong packets, so that I have up-to-date latency metrics.
8. As a visitor, I want connection arcs and badges to reflect latency tiers through colors (green for <100ms, amber for 100–250ms, red for >250ms), so that I can intuitively assess connectivity quality at a glance.
9. As a visitor, I want an overlay HUD displaying current peer count, a list of active peers with country flags, and live millisecond latency readouts, so that I can inspect detailed connection health.
10. As a visitor, I want the globe to support intuitive drag-to-rotate, pinch/scroll-to-zoom, and an auto-rotation toggle, so that I can freely inspect global peer distribution.
11. As a collaborator, I want to append a room identifier to the URL hash (e.g., `#team-room`) to join a dedicated private mesh room, so that I can measure connectivity specifically within a designated group.
12. As a visitor, I want the application to automatically default to a shared `#global` mesh when no room hash is present, so that I can immediately find open peers.
13. As a mobile or low-power device user, I want the client to maintain a soft limit of 25 direct WebRTC peer connections, so that my browser does not experience WebGL stutter or CPU overload from mesh scaling.
14. As an open-source contributor or auditor, I want to see the exact Git describe release or commit version displayed in the UI footer, so that I can verify the provenance and build version of the running deployment.
15. As a developer, I want the project to format and lint code automatically on commit, so that code style and quality remain consistent across the codebase.
16. As a maintainer, I want CI to perform automated dependency vulnerability audits and secret leak scans on pull requests, so that security regressions are detected before merging.
17. As an end user, I want to access the application via a custom domain at `mesh-globe.ii2d.com`, so that the project maintains professional organization branding under `ii2d`.

## Implementation Decisions

### Architectural Topology & Modules
- **Frontend Presentation Layer**: Built with Svelte 5 utilizing Runes for fine-grained reactivity. The presentation layer hosts the full-screen 3D canvas alongside an accessible HUD overlay for peer statistics, room status, and versioning.
- **Globe Visualization Engine**: Built on `globe.gl` (Three.js WebGL). Manages points, ripple rings for active nodes, and bezier arc curves connecting the local client to remote peers. Arcs dynamically update color and particle speed based on measured RTT.
- **Signaling & Mesh Transport**: Implemented using Trystero's Nostr backend (`trystero/nostr`). Rooms are isolated by room IDs derived from the window location hash (falling back to `global`). Handles WebRTC offer/answer handshakes and ICE candidate exchange via public Nostr relays.
- **Peer & Latency State Store**: A centralized reactive store tracking active peers, their approximate coordinates, and connection statistics. Sends periodic ping payloads (`t: performance.now()`) across WebRTC data channels every 2.5 seconds, computes RTT on pong responses, and applies an Exponential Moving Average (EMA) to prevent visual jitter.
- **Geolocation Provider**: Client-side IP geolocation fetched during initialization with city-level coarsening and a deterministic/bounded random coordinate jitter (~5–10 km). Falls back to a neutral default coordinate if network or ad-blockers intercept the lookup.
- **Build & CI/CD Pipeline**: Vite-driven build configured with `pnpm`. Embeds `git describe --tags --always --dirty` at compile time via `__APP_VERSION__`. Automated deployment to GitHub Pages using `actions/deploy-pages` and a `CNAME` pointing to `mesh-globe.ii2d.com`. Includes ESLint, Prettier, Husky, lint-staged, `pnpm audit`, and Gitleaks scanning.

### API & Data Contracts

- **Ping / Pong Data Channel Protocol**:
  - `Ping`: `{ type: 'ping', id: string, t: number }`
  - `Pong`: `{ type: 'pong', id: string, t: number }`
  - `Metadata Broadcast`: `{ type: 'meta', lat: number, lng: number, country: string, city?: string }`

- **Latency Quality Thresholds**:
  - `Optimal`: `< 100 ms` (Hex `#22c55e` / Green)
  - `Acceptable`: `100 ms – 250 ms` (Hex `#eab308` / Amber)
  - `Degraded`: `> 250 ms` (Hex `#ef4444` / Red)

- **Peer Mesh Scalability Rule**:
  - Soft cap of 25 active connections. Upon reaching capacity, incoming room discovery notifications avoid establishing additional data channels until an existing connection closes.

## Testing Decisions

### Testing Philosophy
- Tests must verify observable behavior and system contracts rather than private internal implementation details.
- High-level seams are preferred: state management, message serialization/deserialization, latency calculation, and room URL hash parsing.

### Seams to Test
- **Latency & EMA Smoothing Calculator**: Unit tests validating RTT computation, clock skew tolerance, and exponential moving average stability under packet bursts.
- **Protocol Message Serialization**: Schema and payload validation ensuring ping, pong, and coordinate metadata messages handle corrupt or malformed payloads gracefully without crashing the mesh state.
- **Room Hash Router**: Tests verifying that URL hash changes properly re-initialize the Trystero room context and disconnect prior peers.
- **Peer Connection Cap Store**: Tests ensuring the peer store stops accepting new peer connections when the 25-peer threshold is satisfied and cleans up gracefully upon peer disconnects.

## Out of Scope

- Centralized backend servers, authentication, or persistent database storage.
- Audio, video, or arbitrary file-sharing streams over WebRTC (only metadata and telemetry are exchanged).
- TURN server provisioning (relies on STUN and Nostr signaling; symmetric NAT traversal without TURN may experience reduced connectivity between strict corporate networks).
- SFU (Selective Forwarding Unit) media relaying (the topology is strictly peer-to-peer mesh).

## Further Notes

- The project should be initialized with Git, and the repository URL configured for `github.com/ii2d/mesh-globe`.
- GitHub Pages custom domain records for `mesh-globe.ii2d.com` should be configured with a CNAME pointing to `ii2d.github.io`.
