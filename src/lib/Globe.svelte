<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Globe, { type GlobeInstance } from 'globe.gl';
  import type { GeoLocation } from './geo';
  import type { RemotePeer } from './mesh';
  import { getLatencyColor, getLatencyTier } from './latency';
  import { getGlobeStyle, type GlobeStyleId } from './globe-styles';

  interface Props {
    location?: GeoLocation | null;
    peers?: RemotePeer[];
    autoRotate?: boolean;
    globeStyle?: GlobeStyleId;
    showBorders?: boolean;
  }

  let {
    location = null,
    peers = [],
    autoRotate = $bindable(true),
    globeStyle = 'night',
    showBorders = true,
  }: Props = $props();

  interface CountryFeature {
    type: string;
    geometry: {
      type: string;
      coordinates: unknown[];
    };
    properties?: {
      ADMIN?: string;
      NAME?: string;
      ISO_A2?: string;
    };
  }

  let containerEl = $state<HTMLDivElement | null>(null);
  let globeInstance = $state<GlobeInstance | null>(null);
  let countriesData = $state<CountryFeature[]>([]);
  let hoveredCountry = $state<CountryFeature | null>(null);
  let resizeObserver: ResizeObserver | null = null;

  interface GlobePoint {
    id: string;
    lat: number;
    lng: number;
    size: number;
    color: string;
    label: string;
    isLocal: boolean;
  }

  interface GlobeRing {
    lat: number;
    lng: number;
    maxR: number;
    propagationSpeed: number;
    repeatPeriod: number;
    color: (t: number) => string;
  }

  interface GlobeArc {
    id: string;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: [string, string];
    altitude?: number;
    stroke?: number;
    dashLength: number;
    dashGap: number;
    animateTime: number;
    label: string;
  }

  interface GlobeHtmlMarker {
    id: string;
    lat: number;
    lng: number;
    label: string;
  }

  let hasCenteredInitialView = false;

  export function focusOnUser() {
    if (globeInstance && location) {
      const currentPov = globeInstance.pointOfView();
      const altitude = currentPov?.altitude ?? 2.2;
      globeInstance.pointOfView({ lat: location.lat, lng: location.lng, altitude }, 1200);
    }
  }

  export function focusOnCoordinates(lat: number, lng: number) {
    if (globeInstance) {
      const currentPov = globeInstance.pointOfView();
      const altitude = currentPov?.altitude ?? 2.2;
      globeInstance.pointOfView({ lat, lng, altitude }, 1200);
    }
  }

  function updateGlobeData() {
    if (!globeInstance) return;

    const points: GlobePoint[] = [];
    const rings: GlobeRing[] = [];
    const arcs: GlobeArc[] = [];
    const htmlMarkers: GlobeHtmlMarker[] = [];

    // Local user node
    if (location) {
      const cityText = location.city ? `${location.city}, ` : '';
      const countryText = location.country || 'Local Node';
      const fallbackBadge = location.isFallback ? ' (Approximate)' : '';

      points.push({
        id: 'local',
        lat: location.lat,
        lng: location.lng,
        size: 0.8,
        color: '#00f0ff',
        label: `<div class="globe-tooltip">
          <div class="tooltip-title">★ You (Local Node)</div>
          <div class="tooltip-body">${cityText}${countryText}${fallbackBadge}</div>
          <div class="tooltip-coords">${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°</div>
        </div>`,
        isLocal: true,
      });

      // Double-frequency energetic ripple for local user node
      rings.push({
        lat: location.lat,
        lng: location.lng,
        maxR: 5.0,
        propagationSpeed: 2.0,
        repeatPeriod: 1400,
        color: (t: number) => `rgba(0, 240, 255, ${Math.sqrt(1 - t) * 0.95})`,
      });

      // Prominent floating "YOU" 3D badge tag
      htmlMarkers.push({
        id: 'marker-local',
        lat: location.lat,
        lng: location.lng,
        label: 'YOU',
      });
    }

    // Remote peer nodes and arcs
    for (const peer of peers) {
      let peerLat: number;
      let peerLng: number;
      let isUnlocated = false;

      if (peer.metadata) {
        peerLat = peer.metadata.lat;
        peerLng = peer.metadata.lng;

        // If local node and peer are in virtually the exact same coordinates (e.g. testing multiple tabs on same IP),
        // apply a deterministic visual displacement so they don't stack directly on top of each other.
        if (location) {
          const dLat = Math.abs(peerLat - location.lat);
          const dLng = Math.abs(peerLng - location.lng);
          if (dLat < 0.2 && dLng < 0.2) {
            const hash = peer.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const angle = ((hash % 8) / 8) * Math.PI * 2;
            const offsetDeg = 6.0; // ~650 km visual offset on 3D globe for clear separation
            peerLat = Number((peerLat + Math.sin(angle) * offsetDeg).toFixed(4));
            peerLng = Number((peerLng + Math.cos(angle) * offsetDeg).toFixed(4));
          }
        }
      } else {
        // Peer is connected via WebRTC/Nostr, but metadata is still synchronizing
        isUnlocated = true;
        const hash = peer.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        if (location) {
          const angle = ((hash % 12) / 12) * Math.PI * 2;
          peerLat = Math.max(-85, Math.min(85, location.lat + Math.sin(angle) * 7.0));
          peerLng = location.lng + Math.cos(angle) * 7.0;
        } else {
          peerLat = (hash % 120) - 60;
          peerLng = ((hash * 13) % 360) - 180;
        }
      }

      const pCity = peer.metadata?.city ? `${peer.metadata.city}, ` : '';
      const pCountry = peer.metadata?.country || (isUnlocated ? 'Locating...' : 'Remote Peer');
      const rttVal = peer.emaRtt ?? peer.rtt;
      const latencyColor = isUnlocated
        ? '#f59e0b'
        : rttVal !== undefined
          ? getLatencyColor(rttVal)
          : '#a855f7';
      const latencyTier = isUnlocated
        ? 'locating'
        : rttVal !== undefined
          ? getLatencyTier(rttVal)
          : 'unknown';
      const rttText =
        rttVal !== undefined
          ? `${Math.round(rttVal)} ms`
          : isUnlocated
            ? 'Syncing coordinates...'
            : 'Measuring...';

      points.push({
        id: peer.id,
        lat: peerLat,
        lng: peerLng,
        size: isUnlocated ? 0.45 : 0.55,
        color: latencyColor,
        label: `<div class="globe-tooltip">
          <div class="tooltip-title">Peer [${peer.id.slice(0, 8)}]</div>
          <div class="tooltip-body">${pCity}${pCountry}${isUnlocated ? ' (Syncing)' : ''}</div>
          <div class="tooltip-latency" style="color: ${latencyColor}">RTT: ${rttText} (${latencyTier})</div>
          <div class="tooltip-coords">${peerLat.toFixed(2)}°, ${peerLng.toFixed(2)}°</div>
        </div>`,
        isLocal: false,
      });

      rings.push({
        lat: peerLat,
        lng: peerLng,
        maxR: isUnlocated ? 2.6 : 3.4,
        propagationSpeed: isUnlocated ? 0.9 : 1.3,
        repeatPeriod: isUnlocated ? 1500 : 2100,
        color: (t: number) => {
          const rgb =
            latencyColor === '#22c55e'
              ? '34, 197, 94'
              : latencyColor === '#ef4444'
                ? '239, 68, 68'
                : latencyColor === '#f59e0b' || latencyColor === '#eab308'
                  ? '245, 158, 11'
                  : '168, 85, 247';
          return `rgba(${rgb}, ${Math.sqrt(1 - t) * 0.75})`;
        },
      });

      // 3D connection lines and packet transmission pulses
      if (location) {
        const animateTime =
          rttVal !== undefined ? Math.max(1000, Math.min(3200, Math.round(rttVal * 12))) : 1800;

        arcs.push({
          id: `arc-${peer.id}`,
          startLat: location.lat,
          startLng: location.lng,
          endLat: peerLat,
          endLng: peerLng,
          color: ['#38bdf8', latencyColor],
          dashLength: 0.35,
          dashGap: 0.18,
          animateTime,
          label: `<div class="globe-tooltip">
            <div class="tooltip-title">Mesh Connection & Packets</div>
            <div class="tooltip-body">To: ${peer.id.slice(0, 8)}</div>
            <div class="tooltip-latency" style="color: ${latencyColor}">RTT: ${rttText}</div>
          </div>`,
        });
      }
    }

    globeInstance.pointsData(points).ringsData(rings).arcsData(arcs).htmlElementsData(htmlMarkers);
  }

  $effect(() => {
    // Reactively update when location, peers, or globeInstance change
    const loc = location;
    void peers;
    const inst = globeInstance;

    if (inst) {
      updateGlobeData();

      // Smoothly pan camera to center on user once location is resolved
      if (loc && !hasCenteredInitialView) {
        hasCenteredInitialView = true;
        inst.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 2.2 }, 1400);
      }
    }
  });

  let prevAutoRotate = $state(autoRotate);

  $effect(() => {
    // Reactively toggle auto rotation
    if (globeInstance) {
      const controls = globeInstance.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.5;

      // When rotation is stopped (transition from true to false), smoothly return camera to local user's lat/lng
      if (prevAutoRotate && !autoRotate && location) {
        const currentPov = globeInstance.pointOfView();
        const altitude = currentPov?.altitude ?? 2.2;
        globeInstance.pointOfView({ lat: location.lat, lng: location.lng, altitude }, 1200);
      }
      prevAutoRotate = autoRotate;
    }
  });

  $effect(() => {
    // Reactively update globe theme texture and atmospheric glow
    if (globeInstance) {
      const config = getGlobeStyle(globeStyle);
      globeInstance.globeImageUrl(config.globeImageUrl);
      globeInstance.bumpImageUrl(config.bumpImageUrl || '');
      globeInstance.atmosphereColor(config.atmosphereColor);
      globeInstance.atmosphereAltitude(config.atmosphereAltitude);
      globeInstance.polygonStrokeColor(() => config.borderStrokeColor);
      globeInstance.polygonCapColor((d: object) =>
        d === hoveredCountry ? config.hoverFillColor : 'rgba(0, 0, 0, 0)',
      );
    }
  });

  $effect(() => {
    // Reactively toggle country border polygons
    if (globeInstance) {
      globeInstance.polygonsData(showBorders ? countriesData : []);
    }
  });

  onMount(() => {
    if (!containerEl) return;

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || window.innerHeight;

    const currentStyleConfig = getGlobeStyle(globeStyle);

    globeInstance = new Globe(containerEl, {
      waitForGlobeReady: false,
      animateIn: true,
    })
      .width(width)
      .height(height)
      .backgroundColor('rgba(5, 8, 17, 0)')
      .globeImageUrl(currentStyleConfig.globeImageUrl)
      .bumpImageUrl(currentStyleConfig.bumpImageUrl || '')
      .atmosphereColor(currentStyleConfig.atmosphereColor)
      .atmosphereAltitude(currentStyleConfig.atmosphereAltitude)
      // Country Border Polygons
      .polygonGeoJsonGeometry('geometry')
      .polygonCapColor((d: object) => {
        const config = getGlobeStyle(globeStyle);
        return d === hoveredCountry ? config.hoverFillColor : 'rgba(0, 0, 0, 0)';
      })
      .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
      .polygonStrokeColor(() => {
        const config = getGlobeStyle(globeStyle);
        return config.borderStrokeColor;
      })
      .polygonAltitude((d: object) => (d === hoveredCountry ? 0.012 : 0.005))
      .polygonLabel((d: object) => {
        const feat = d as CountryFeature;
        const name = feat.properties?.ADMIN || feat.properties?.NAME || 'Country';
        return `<div class="globe-tooltip">
          <div class="tooltip-title">🏳️ ${name}</div>
        </div>`;
      })
      .onPolygonHover((hoverD: object | null) => {
        const feat = hoverD as CountryFeature | null;
        if (hoveredCountry !== feat) {
          hoveredCountry = feat;
          if (globeInstance) {
            globeInstance.polygonCapColor(globeInstance.polygonCapColor());
            globeInstance.polygonAltitude(globeInstance.polygonAltitude());
          }
        }
      })
      // Points
      .pointLat('lat')
      .pointLng('lng')
      .pointColor('color')
      .pointRadius('size')
      .pointAltitude(0.015)
      .pointLabel('label')
      // Rings
      .ringLat('lat')
      .ringLng('lng')
      .ringColor((d: unknown) => (d as GlobeRing).color)
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod('repeatPeriod')
      // Arcs
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcDashLength('dashLength')
      .arcDashGap('dashGap')
      .arcDashAnimateTime('animateTime')
      .arcLabel('label')
      // HTML Elements (Floating "YOU" 3D Pin)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.02)
      .htmlElement((d: unknown) => {
        const marker = d as GlobeHtmlMarker;
        const el = document.createElement('div');
        el.className = 'globe-you-pin';
        el.innerHTML = `
          <div class="pin-tag">
            <span class="pin-pulse"></span>
            <span class="pin-text">${marker.label}</span>
          </div>
          <div class="pin-stem"></div>
        `;
        return el;
      })
      .htmlElementVisibilityModifier((el: HTMLElement, isVisible: boolean) => {
        el.style.opacity = isVisible ? '1' : '0';
        el.style.pointerEvents = isVisible ? 'auto' : 'none';
      });

    const controls = globeInstance.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    (window as unknown as { __globeInstance: GlobeInstance }).__globeInstance = globeInstance;

    updateGlobeData();

    if (location) {
      globeInstance.pointOfView({ lat: location.lat, lng: location.lng, altitude: 2.2 }, 1200);
    } else {
      globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (globeInstance && w > 0 && h > 0) {
          globeInstance.width(w).height(h);
        }
      }
    });
    resizeObserver.observe(containerEl);

    // Fetch and initialize geopolitical border polygons
    fetch('/datasets/countries.geojson')
      .then((res) => res.json())
      .then((data: { features: CountryFeature[] }) => {
        countriesData = data.features || [];
        if (globeInstance && showBorders) {
          globeInstance.polygonsData(countriesData);
        }
      })
      .catch(() => {});
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (globeInstance) {
      globeInstance._destructor();
      globeInstance = null;
    }
  });
</script>

<div class="globe-viewport" bind:this={containerEl}></div>

<style>
  .globe-viewport {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    cursor: grab;
  }

  .globe-viewport:active {
    cursor: grabbing;
  }

  :global(.globe-tooltip) {
    background: rgba(15, 23, 42, 0.92) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(56, 189, 248, 0.3) !important;
    border-radius: 8px !important;
    padding: 0.5rem 0.75rem !important;
    color: #f8fafc !important;
    font-family:
      'Inter',
      -apple-system,
      BlinkMacSystemFont,
      sans-serif !important;
    font-size: 0.75rem !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
    pointer-events: none !important;
  }

  :global(.globe-tooltip .tooltip-title) {
    font-weight: 600;
    color: #38bdf8;
    margin-bottom: 2px;
  }

  :global(.globe-tooltip .tooltip-body) {
    color: #e2e8f0;
  }

  :global(.globe-tooltip .tooltip-latency) {
    font-weight: 600;
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    margin-top: 3px;
  }

  :global(.globe-tooltip .tooltip-coords) {
    font-family: ui-monospace, monospace;
    color: #94a3b8;
    font-size: 0.7rem;
    margin-top: 2px;
  }

  :global(.globe-you-pin) {
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -100%);
    pointer-events: none;
    transition: opacity 0.25s ease;
    user-select: none;
  }

  :global(.globe-you-pin .pin-tag) {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.55rem;
    background: rgba(14, 165, 233, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 9999px;
    box-shadow:
      0 0 15px rgba(56, 189, 248, 0.9),
      0 2px 8px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
  }

  :global(.globe-you-pin .pin-pulse) {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 6px #ffffff;
  }

  :global(.globe-you-pin .pin-text) {
    font-size: 0.65rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.08em;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    text-transform: uppercase;
  }

  :global(.globe-you-pin .pin-stem) {
    width: 1.5px;
    height: 10px;
    background: linear-gradient(to bottom, rgba(56, 189, 248, 0.9), transparent);
  }
</style>
