export type GlobeStyleId = 'night' | 'satellite' | 'cyber';

export interface GlobeStyleConfig {
  id: GlobeStyleId;
  name: string;
  description: string;
  icon: string;
  globeImageUrl: string;
  bumpImageUrl: string | null;
  atmosphereColor: string;
  atmosphereAltitude: number;
  borderStrokeColor: string;
  hoverFillColor: string;
}

export const GLOBE_STYLES: Record<GlobeStyleId, GlobeStyleConfig> = {
  night: {
    id: 'night',
    name: 'Night Ops',
    description: 'City lights with cyan atmosphere',
    icon: '🌙',
    globeImageUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
    bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#38bdf8',
    atmosphereAltitude: 0.18,
    borderStrokeColor: 'rgba(56, 189, 248, 0.22)',
    hoverFillColor: 'rgba(56, 189, 248, 0.15)',
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    description: 'Photorealistic daylight Earth',
    icon: '🌍',
    globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#60a5fa',
    atmosphereAltitude: 0.18,
    borderStrokeColor: 'rgba(255, 255, 255, 0.35)',
    hoverFillColor: 'rgba(255, 255, 255, 0.2)',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Dark',
    description: 'Monochrome dark with purple neon glow',
    icon: '🛸',
    globeImageUrl: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
    bumpImageUrl: null,
    atmosphereColor: '#c084fc',
    atmosphereAltitude: 0.22,
    borderStrokeColor: 'rgba(192, 132, 252, 0.3)',
    hoverFillColor: 'rgba(192, 132, 252, 0.18)',
  },
};

export const DEFAULT_STYLE_ID: GlobeStyleId = 'night';

export function getGlobeStyle(styleId: GlobeStyleId): GlobeStyleConfig {
  return GLOBE_STYLES[styleId] || GLOBE_STYLES[DEFAULT_STYLE_ID];
}
