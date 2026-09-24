<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Globe, { type GlobeInstance } from 'globe.gl';
  import type { GeoLocation } from './geo';

  interface Props {
    location?: GeoLocation | null;
    autoRotate?: boolean;
  }

  let { location = null, autoRotate = $bindable(true) }: Props = $props();

  let containerEl = $state<HTMLDivElement | null>(null);
  let globeInstance: GlobeInstance | null = null;
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

  function updateGlobeData() {
    if (!globeInstance) return;

    const points: GlobePoint[] = [];
    const rings: GlobeRing[] = [];

    if (location) {
      const cityText = location.city ? `${location.city}, ` : '';
      const countryText = location.country || 'Local Node';
      const fallbackBadge = location.isFallback ? ' (Approximate)' : '';

      points.push({
        id: 'local',
        lat: location.lat,
        lng: location.lng,
        size: 0.65,
        color: '#38bdf8',
        label: `<div class="globe-tooltip">
          <div class="tooltip-title">You</div>
          <div class="tooltip-body">${cityText}${countryText}${fallbackBadge}</div>
          <div class="tooltip-coords">${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°</div>
        </div>`,
        isLocal: true,
      });

      rings.push({
        lat: location.lat,
        lng: location.lng,
        maxR: 4.5,
        propagationSpeed: 1.8,
        repeatPeriod: 1600,
        color: (t: number) => `rgba(56, 189, 248, ${Math.sqrt(1 - t) * 0.85})`,
      });
    }

    globeInstance.pointsData(points).ringsData(rings);
  }

  $effect(() => {
    // Reactively update points and rings when location changes
    if (location && globeInstance) {
      updateGlobeData();
      globeInstance.pointOfView({ lat: location.lat, lng: location.lng, altitude: 2.2 }, 1500);
    }
  });

  $effect(() => {
    // Reactively toggle auto rotation
    if (globeInstance) {
      const controls = globeInstance.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.5;
    }
  });

  onMount(() => {
    if (!containerEl) return;

    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || window.innerHeight;

    globeInstance = new Globe(containerEl, {
      waitForGlobeReady: false,
      animateIn: true,
    })
      .width(width)
      .height(height)
      .backgroundColor('rgba(5, 8, 17, 0)')
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .atmosphereColor('#38bdf8')
      .atmosphereAltitude(0.18)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor('color')
      .pointRadius('size')
      .pointAltitude(0.015)
      .pointLabel('label')
      .ringLat('lat')
      .ringLng('lng')
      .ringColor((d: unknown) => (d as GlobeRing).color)
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod('repeatPeriod');

    const controls = globeInstance.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    if (location) {
      updateGlobeData();
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
    background: rgba(15, 23, 42, 0.9) !important;
    backdrop-filter: blur(8px) !important;
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
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
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

  :global(.globe-tooltip .tooltip-coords) {
    font-family: ui-monospace, monospace;
    color: #94a3b8;
    font-size: 0.7rem;
    margin-top: 2px;
  }
</style>
