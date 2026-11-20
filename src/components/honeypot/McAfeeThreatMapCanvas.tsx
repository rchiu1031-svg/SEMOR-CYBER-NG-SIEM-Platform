import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { cn } from '../../lib/utils';

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Module-level cached GeoJSON promise so switching tabs never re-fetches
let cachedWorldGeoPromise: Promise<any> | null = null;

function loadWorldGeoJson(): Promise<any> {
  if (!cachedWorldGeoPromise) {
    cachedWorldGeoPromise = fetch(WORLD_ATLAS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((topology) => {
        if (topology && topology.objects && topology.objects.countries) {
          return feature(topology, topology.objects.countries);
        }
        return null;
      })
      .catch(() => null);
  }
  return cachedWorldGeoPromise;
}

// Lightweight fallback continent outlines if CDN is unreachable
const FALLBACK_CONTINENTS: Array<Array<[number, number]>> = [
  // North America
  [[-168, 65], [-140, 70], [-95, 68], [-60, 50], [-75, 25], [-85, 10], [-105, 20], [-125, 48], [-168, 65]],
  // South America
  [[-80, 10], [-60, 8], [-35, -8], [-45, -24], [-65, -55], [-75, -45], [-81, -5], [-80, 10]],
  // Europe
  [[-10, 36], [0, 48], [10, 58], [30, 70], [60, 68], [55, 46], [28, 38], [10, 44], [-10, 36]],
  // Africa
  [[-17, 15], [10, 37], [35, 31], [51, 11], [40, -15], [20, -35], [12, -18], [5, 5], [-17, 15]],
  // Asia
  [[35, 42], [60, 68], [120, 73], [170, 65], [142, 45], [122, 30], [105, 10], [80, 8], [60, 25], [35, 42]],
  // Australia
  [[114, -22], [135, -12], [153, -26], [148, -38], [116, -34], [114, -22]],
];

export interface ThreatMapNode {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  type: 'HIVE' | 'SENSOR';
  status?: string;
  attacksCapturedCount?: number;
}

export interface ThreatMapAttack {
  id: string;
  sourceIp: string;
  sourceCity: string;
  sourceCountry: string;
  sourceCountryCode: string;
  sourceLat: number;
  sourceLng: number;
  targetNodeId?: string;
  targetNodeName: string;
  targetLat: number;
  targetLng: number;
  honeypot: string;
  protocol: string;
  attackType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isBlocked?: boolean;
  timestamp?: string;
  payloadSummary?: string;
}

interface ActiveProjectile {
  uid: string;
  attack: ThreatMapAttack;
  color: string;
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  tailLength: number;
  isBlocked: boolean;
  impacted: boolean;
  priority: boolean;
}

interface PulseRipple {
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  alpha: number;
  lineWidth: number;
  kind: 'origin' | 'impact' | 'shield';
  label?: string;
}

interface ImpactSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  length: number;
}

export interface McAfeeThreatMapCanvasProps {
  nodes: ThreatMapNode[];
  attacks: ThreatMapAttack[];
  isPlaying?: boolean;
  velocity?: number;
  compact?: boolean;
  heightClassName?: string;
  focusedAttackId?: string | null;
  focusedNodeId?: string | null;
  onSelectAttack?: (attack: ThreatMapAttack) => void;
  onSelectNode?: (node: ThreatMapNode) => void;
  legendTitle?: string;
}

export function getThreatVectorColor(honeypot: string, severity?: string): string {
  switch (honeypot) {
    case 'Dionaea':
      return '#ff2a55'; // Crimson Red — SMB / Malware
    case 'Cowrie':
      return '#ff7a18'; // Burning Amber-Orange — SSH / Telnet
    case 'Conpot':
      return '#fbbf24'; // Gold — SCADA / ICS
    case 'Tanner':
      return '#a855f7'; // Violet — Web / SQLi
    case 'Log4pot':
      return '#f43f8e'; // Magenta — Log4j JNDI
    case 'Honeytrap':
    case 'Glastopf':
      return '#06b6d4'; // Cyan — Dynamic Port / Web Decoy
    default:
      if (severity === 'CRITICAL') return '#ff2a55';
      if (severity === 'HIGH') return '#ff7a18';
      return '#38bdf8';
  }
}

function quadPoint(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number
): [number, number] {
  const mt = 1 - t;
  return [
    mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  ];
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function McAfeeThreatMapCanvas({
  nodes,
  attacks,
  isPlaying = true,
  velocity = 1,
  compact = false,
  heightClassName,
  focusedAttackId = null,
  focusedNodeId = null,
  onSelectAttack,
  onSelectNode,
  legendTitle,
}: McAfeeThreatMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [geoData, setGeoData] = useState<any>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: compact ? 760 : 960,
    height: compact ? 360 : 480,
  });
  const [hoveredTarget, setHoveredTarget] = useState<{
    x: number;
    y: number;
    kind: 'node' | 'attack';
    node?: ThreatMapNode;
    attack?: ThreatMapAttack;
  } | null>(null);
  const [liveArcCount, setLiveArcCount] = useState<number>(0);

  // Refs for animation loop so we never tear down RAF when props update
  const attacksRef = useRef<ThreatMapAttack[]>(attacks);
  const nodesRef = useRef<ThreatMapNode[]>(nodes);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const velocityRef = useRef<number>(velocity);
  const focusedAttackIdRef = useRef<string | null>(focusedAttackId);
  const focusedNodeIdRef = useRef<string | null>(focusedNodeId);

  const projectilesRef = useRef<ActiveProjectile[]>([]);
  const ripplesRef = useRef<PulseRipple[]>([]);
  const sparksRef = useRef<ImpactSpark[]>([]);
  const seenAttackIdsRef = useRef<Set<string>>(new Set());
  const ambientIndexRef = useRef<number>(0);
  const lastSpawnAtRef = useRef<number>(0);
  const activeCountryGlowRef = useRef<Map<string, { x: number; y: number; color: string; intensity: number }>>(new Map());

  attacksRef.current = attacks;
  nodesRef.current = nodes;
  isPlayingRef.current = isPlaying;
  velocityRef.current = velocity;
  focusedAttackIdRef.current = focusedAttackId;
  focusedNodeIdRef.current = focusedNodeId;

  // Load TopoJSON world geometry once
  useEffect(() => {
    let mounted = true;
    loadWorldGeoJson().then((geo) => {
      if (mounted && geo) setGeoData(geo);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Responsive ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(compact ? 320 : 440, Math.floor(rect.height));
      setDimensions((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact]);

  // Natural Earth 1 projection tuned to fill the viewport cleanly without clipping polar margins
  const projection = useMemo(() => {
    const { width, height } = dimensions;
    const scale = Math.min(width / 5.15, height / 2.48);
    return d3
      .geoNaturalEarth1()
      .scale(scale)
      .center([16, 14])
      .translate([width * 0.5, height * 0.54]);
  }, [dimensions]);

  const projectionRef = useRef(projection);
  projectionRef.current = projection;

  // Render static world map background into offscreen canvas whenever dimensions or geoData change
  useEffect(() => {
    const { width, height } = dimensions;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.floor(width * dpr);
    offscreen.height = Math.floor(height * dpr);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // 1. Deep tactical dark-ops ocean gradient (McAfee style obsidian blue-black)
    const oceanGrad = ctx.createRadialGradient(
      width * 0.52,
      height * 0.45,
      width * 0.05,
      width * 0.5,
      height * 0.5,
      width * 0.78
    );
    oceanGrad.addColorStop(0, '#0a1426');
    oceanGrad.addColorStop(0.55, '#060c18');
    oceanGrad.addColorStop(1, '#03050b');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle tactical lat/lon graticule grid
    const pathGen = d3.geoPath(projection, ctx);
    const graticule = d3.geoGraticule().step([20, 20])();
    ctx.beginPath();
    pathGen(graticule);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.055)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // 3. Equator subtle reference line
    const equator: any = {
      type: 'LineString',
      coordinates: [[-180, 0], [180, 0]],
    };
    ctx.beginPath();
    pathGen(equator);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.11)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. World Landmass Polygons (TopoJSON or fallback)
    const landGrad = ctx.createLinearGradient(0, 0, 0, height);
    landGrad.addColorStop(0, '#132238');
    landGrad.addColorStop(0.5, '#0f1b2e');
    landGrad.addColorStop(1, '#0b1424');

    ctx.save();
    if (geoData && geoData.features) {
      ctx.beginPath();
      for (const feat of geoData.features) {
        // Skip Antarctica for cleaner cyber threat map framing
        if (feat.id === '010' || feat.properties?.name === 'Antarctica') continue;
        pathGen(feat);
      }
      ctx.fillStyle = landGrad;
      ctx.fill();

      // Subtle tactical dot-matrix texture inside landmasses
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(125, 211, 252, 0.075)';
      const step = compact ? 9 : 8;
      for (let x = 4; x < width; x += step) {
        for (let y = 4; y < height; y += step) {
          ctx.fillRect(x, y, 1.1, 1.1);
        }
      }
      ctx.restore();

      // Luminous geopolitical borders
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
      ctx.lineWidth = 0.75;
      ctx.stroke();
    } else {
      // Offline fallback continents
      for (const poly of FALLBACK_CONTINENTS) {
        ctx.beginPath();
        poly.forEach((coord, i) => {
          const pt = projection(coord);
          if (!pt) return;
          if (i === 0) ctx.moveTo(pt[0], pt[1]);
          else ctx.lineTo(pt[0], pt[1]);
        });
        ctx.closePath();
        ctx.fillStyle = landGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.26)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();

    // 5. Subtle corner vignette for depth
    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.38,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.72
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(2, 4, 10, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    bgCanvasRef.current = offscreen;
  }, [dimensions, geoData, projection, compact]);

  // Spawn an animated projectile for a given ThreatMapAttack
  const spawnProjectile = useCallback((attack: ThreatMapAttack, priority = false) => {
    const proj = projectionRef.current;
    const start = proj([attack.sourceLng, attack.sourceLat]);
    const end = proj([attack.targetLng, attack.targetLat]);
    if (!start || !end) return;

    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return;

    // Parabolic northward/upward elevation proportional to great-circle distance
    const midX = (start[0] + end[0]) * 0.5;
    const midY = (start[1] + end[1]) * 0.5;
    const lift = Math.min(185, Math.max(36, dist * 0.34));
    // Curve upward smoothly toward top of map like McAfee threat trajectories
    const ctrlX = midX - dy * 0.08;
    const ctrlY = Math.max(16, midY - lift);

    const color = attack.isBlocked ? '#64748b' : getThreatVectorColor(attack.honeypot, attack.severity);
    const baseSpeed = priority ? 0.0155 : 0.0085 + Math.random() * 0.0065;

    const projectile: ActiveProjectile = {
      uid: `${attack.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      attack,
      color,
      startX: start[0],
      startY: start[1],
      ctrlX,
      ctrlY,
      endX: end[0],
      endY: end[1],
      progress: 0,
      speed: baseSpeed,
      tailLength: priority ? 0.42 : 0.32,
      isBlocked: Boolean(attack.isBlocked),
      impacted: false,
      priority,
    };

    projectilesRef.current.push(projectile);
    if (projectilesRef.current.length > 48) {
      projectilesRef.current.shift();
    }

    // Ignition origin ring
    ripplesRef.current.push({
      x: start[0],
      y: start[1],
      color,
      radius: 2,
      maxRadius: priority ? 28 : 18,
      alpha: 0.9,
      lineWidth: priority ? 2 : 1.4,
      kind: 'origin',
    });

    // Subtle hotspot glow at source city
    activeCountryGlowRef.current.set(attack.sourceCountryCode || attack.sourceIp, {
      x: start[0],
      y: start[1],
      color,
      intensity: 1,
    });
  }, []);

  // Immediately fire bright priority volleys whenever NEW attacks arrive (e.g. simulator or live poll)
  useEffect(() => {
    if (!attacks.length) return;
    const isInitialSeed = seenAttackIdsRef.current.size === 0;

    if (isInitialSeed) {
      // Seed initial wave cleanly across the map
      attacks.slice(0, compact ? 6 : 10).forEach((atk, idx) => {
        seenAttackIdsRef.current.add(atk.id);
        setTimeout(() => {
          spawnProjectile(atk, idx < 2);
        }, idx * 140);
      });
      attacks.forEach((a) => seenAttackIdsRef.current.add(a.id));
    } else {
      const newlyArrived = attacks.filter((a) => !seenAttackIdsRef.current.has(a.id));
      newlyArrived.slice(0, 6).forEach((atk, idx) => {
        seenAttackIdsRef.current.add(atk.id);
        setTimeout(() => {
          spawnProjectile(atk, true);
          // For critical simulated attacks, launch a dramatic twin volley
          if (atk.severity === 'CRITICAL') {
            setTimeout(() => spawnProjectile(atk, true), 180);
          }
        }, idx * 120);
      });
      // Prevent unbounded Set growth
      if (seenAttackIdsRef.current.size > 400) {
        const recent = new Set(attacks.map((a) => a.id));
        seenAttackIdsRef.current = recent;
      }
    }
  }, [attacks, compact, spawnProjectile]);

  // Main 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let lastTime = performance.now();
    let frameTick = 0;

    const render = (now: number) => {
      const dt = Math.min(48, now - lastTime);
      lastTime = now;
      frameTick += 1;

      const { width, height } = dimensions;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.floor(width * dpr);
      const targetH = Math.floor(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Blit cached tactical world map backdrop
      if (bgCanvasRef.current) {
        ctx.drawImage(bgCanvasRef.current, 0, 0, width, height);
      }

      const playing = isPlayingRef.current && !prefersReducedMotion;
      const speedMult = Math.max(0.4, Math.min(5, velocityRef.current || 1));

      // 2. Subtle McAfee-style Radar Scanline Sweep
      if (playing) {
        const sweepPeriod = 14000;
        const sweepX = ((now % sweepPeriod) / sweepPeriod) * (width + 220) - 110;
        const sweepGrad = ctx.createLinearGradient(sweepX - 95, 0, sweepX + 12, 0);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        sweepGrad.addColorStop(0.82, 'rgba(56, 189, 248, 0.04)');
        sweepGrad.addColorStop(0.98, 'rgba(56, 189, 248, 0.13)');
        sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(Math.max(0, sweepX - 95), 0, 110, height);
      }

      // 3. Ambient source thermal glows
      activeCountryGlowRef.current.forEach((glow, key) => {
        const g = ctx.createRadialGradient(glow.x, glow.y, 1, glow.x, glow.y, 26);
        g.addColorStop(0, hexToRgba(glow.color, 0.38 * glow.intensity));
        g.addColorStop(0.5, hexToRgba(glow.color, 0.12 * glow.intensity));
        g.addColorStop(1, hexToRgba(glow.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(glow.x, glow.y, 26, 0, Math.PI * 2);
        ctx.fill();
        if (playing) {
          glow.intensity -= 0.0032 * (dt / 16.6);
          if (glow.intensity <= 0.08) {
            activeCountryGlowRef.current.delete(key);
          }
        }
      });

      // 4. Spawn continuous ambient staggered arcs from current live attacks
      const currentAttacks = attacksRef.current;
      const spawnIntervalMs = Math.max(190, (compact ? 780 : 540) / speedMult);
      if (playing && currentAttacks.length > 0 && now - lastSpawnAtRef.current >= spawnIntervalMs) {
        lastSpawnAtRef.current = now;
        const idx = ambientIndexRef.current % currentAttacks.length;
        ambientIndexRef.current += 1;
        spawnProjectile(currentAttacks[idx], false);
      }

      // 5. Persistent faint corridor guide web for recent attacks (gives unmistakable McAfee density)
      const proj = projectionRef.current;
      ctx.save();
      currentAttacks.slice(0, compact ? 10 : 18).forEach((atk) => {
        const s = proj([atk.sourceLng, atk.sourceLat]);
        const e = proj([atk.targetLng, atk.targetLat]);
        if (!s || !e) return;
        const dx = e[0] - s[0];
        const dy = e[1] - s[1];
        const dist = Math.hypot(dx, dy);
        const lift = Math.min(185, Math.max(36, dist * 0.34));
        const cx = (s[0] + e[0]) * 0.5 - dy * 0.08;
        const cy = Math.max(16, (s[1] + e[1]) * 0.5 - lift);
        const col = atk.isBlocked ? '#64748b' : getThreatVectorColor(atk.honeypot, atk.severity);
        const isFocused = focusedAttackIdRef.current === atk.id;

        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.quadraticCurveTo(cx, cy, e[0], e[1]);
        ctx.strokeStyle = hexToRgba(col, isFocused ? 0.65 : atk.isBlocked ? 0.08 : 0.13);
        ctx.lineWidth = isFocused ? 2.2 : 0.9;
        if (atk.isBlocked) ctx.setLineDash([3, 4]);
        else ctx.setLineDash([]);
        ctx.stroke();
      });
      ctx.restore();

      // 6. Render Active Luminous Projectiles (Additive Blending for McAfee Neon Beam Feel)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const nextProjectiles: ActiveProjectile[] = [];

      for (const p of projectilesRef.current) {
        if (playing) {
          p.progress += p.speed * speedMult * (dt / 16.6);
        }

        const maxT = p.isBlocked ? 0.62 : 1.0;
        const headT = Math.min(maxT, p.progress);
        const tailT = Math.max(0, p.progress - p.tailLength);

        if (tailT < maxT) {
          const steps = 18;
          const pts: Array<[number, number]> = [];
          for (let i = 0; i <= steps; i++) {
            const t = tailT + ((headT - tailT) * i) / steps;
            pts.push(quadPoint(t, p.startX, p.startY, p.ctrlX, p.ctrlY, p.endX, p.endY));
          }

          if (pts.length >= 2) {
            const firstPt = pts[0];
            const lastPt = pts[pts.length - 1];

            // Outer glowing beam halo
            const haloGrad = ctx.createLinearGradient(firstPt[0], firstPt[1], lastPt[0], lastPt[1]);
            haloGrad.addColorStop(0, hexToRgba(p.color, 0));
            haloGrad.addColorStop(0.55, hexToRgba(p.color, p.priority ? 0.32 : 0.2));
            haloGrad.addColorStop(1, hexToRgba(p.color, p.priority ? 0.62 : 0.42));

            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.strokeStyle = haloGrad;
            ctx.lineWidth = p.priority ? 5.5 : 3.8;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Crisp core energy trail
            const coreGrad = ctx.createLinearGradient(firstPt[0], firstPt[1], lastPt[0], lastPt[1]);
            coreGrad.addColorStop(0, hexToRgba(p.color, 0));
            coreGrad.addColorStop(0.65, hexToRgba(p.color, 0.92));
            coreGrad.addColorStop(1, '#ffffff');

            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.strokeStyle = coreGrad;
            ctx.lineWidth = p.priority ? 2.3 : 1.5;
            ctx.stroke();

            // Glowing comet head orb (while still in flight)
            if (p.progress <= maxT) {
              const orbRadius = p.priority ? 11 : 7.5;
              const orbGrad = ctx.createRadialGradient(lastPt[0], lastPt[1], 0.5, lastPt[0], lastPt[1], orbRadius);
              orbGrad.addColorStop(0, '#ffffff');
              orbGrad.addColorStop(0.32, hexToRgba(p.color, 0.95));
              orbGrad.addColorStop(1, hexToRgba(p.color, 0));
              ctx.fillStyle = orbGrad;
              ctx.beginPath();
              ctx.arc(lastPt[0], lastPt[1], orbRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Trigger impact shockwave & sparks right when projectile arrives at target (or NAC shield)
          if (!p.impacted && p.progress >= maxT) {
            p.impacted = true;
            const [ix, iy] = quadPoint(maxT, p.startX, p.startY, p.ctrlX, p.ctrlY, p.endX, p.endY);
            if (p.isBlocked) {
              ripplesRef.current.push({
                x: ix,
                y: iy,
                color: '#38bdf8',
                radius: 2,
                maxRadius: 18,
                alpha: 0.85,
                lineWidth: 1.6,
                kind: 'shield',
                label: 'BLOCKED',
              });
            } else {
              const shortTarget = p.attack.targetNodeName
                .replace(/^(SEMOR-POT|TPOT)-(HIVE|SENSOR)-/i, '')
                .split(' ')[0];
              ripplesRef.current.push({
                x: ix,
                y: iy,
                color: p.color,
                radius: 3,
                maxRadius: p.priority ? 44 : 30,
                alpha: 0.95,
                lineWidth: p.priority ? 2.2 : 1.6,
                kind: 'impact',
                label: p.priority || Math.random() > 0.55
                  ? `${p.attack.sourceCountryCode} → ${shortTarget} · ${p.attack.honeypot}`
                  : undefined,
              });
              // Secondary delayed shockwave ring
              ripplesRef.current.push({
                x: ix,
                y: iy,
                color: '#ffffff',
                radius: 1,
                maxRadius: p.priority ? 24 : 16,
                alpha: 0.8,
                lineWidth: 1.2,
                kind: 'impact',
              });

              // Radial sparks
              const sparkCount = p.priority ? 8 : 4;
              for (let s = 0; s < sparkCount; s++) {
                const angle = (Math.PI * 2 * s) / sparkCount + Math.random() * 0.5;
                const spd = 0.8 + Math.random() * 1.8;
                sparksRef.current.push({
                  x: ix,
                  y: iy,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  color: p.color,
                  alpha: 0.95,
                  length: 4 + Math.random() * 5,
                });
              }
            }
          }

          nextProjectiles.push(p);
        }
      }
      projectilesRef.current = nextProjectiles;

      // 7. Render Expanding Shockwaves & Sparks
      const nextRipples: PulseRipple[] = [];
      for (const r of ripplesRef.current) {
        if (playing) {
          r.radius += (r.maxRadius - r.radius) * 0.095 * (dt / 16.6) + 0.35;
          r.alpha -= 0.022 * (dt / 16.6);
        }
        if (r.alpha > 0.02) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = hexToRgba(r.color, r.alpha);
          ctx.lineWidth = r.lineWidth;
          ctx.stroke();

          if (r.label && r.alpha > 0.25) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.font = '600 9px "JetBrains Mono", ui-monospace, monospace';
            const textY = Math.max(18, r.y - 14 - (1 - r.alpha) * 14);
            ctx.fillStyle = hexToRgba('#ffffff', Math.min(0.95, r.alpha * 1.2));
            ctx.textAlign = 'center';
            ctx.fillText(r.label, r.x, textY);
            ctx.restore();
          }

          nextRipples.push(r);
        }
      }
      ripplesRef.current = nextRipples;

      const nextSparks: ImpactSpark[] = [];
      for (const sp of sparksRef.current) {
        if (playing) {
          sp.x += sp.vx * (dt / 16.6);
          sp.y += sp.vy * (dt / 16.6);
          sp.vx *= 0.94;
          sp.vy *= 0.94;
          sp.alpha -= 0.038 * (dt / 16.6);
        }
        if (sp.alpha > 0.04) {
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y);
          ctx.lineTo(sp.x - sp.vx * sp.length, sp.y - sp.vy * sp.length);
          ctx.strokeStyle = hexToRgba(sp.color, sp.alpha);
          ctx.lineWidth = 1.3;
          ctx.stroke();
          nextSparks.push(sp);
        }
      }
      sparksRef.current = nextSparks;
      ctx.restore();

      // 8. Draw Origin Attack Hotspots (clickable pins)
      const drawnOrigins = new Set<string>();
      currentAttacks.slice(0, compact ? 12 : 24).forEach((atk) => {
        const key = `${atk.sourceLat.toFixed(1)},${atk.sourceLng.toFixed(1)}`;
        if (drawnOrigins.has(key)) return;
        drawnOrigins.add(key);

        const pt = proj([atk.sourceLng, atk.sourceLat]);
        if (!pt) return;
        const col = atk.isBlocked ? '#64748b' : getThreatVectorColor(atk.honeypot, atk.severity);
        const isFocused = focusedAttackIdRef.current === atk.id;
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.005 + atk.sourceLng);

        // Soft halo
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], isFocused ? 9 : 4.5 + pulse * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(col, isFocused ? 0.35 : 0.22);
        ctx.fill();

        // Crisp core dot
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], isFocused ? 4.2 : atk.severity === 'CRITICAL' ? 3.2 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isFocused ? 1.5 : 0.8;
        ctx.stroke();
      });

      // 9. Draw SEMOR-POT Target Hive & Distributed Sensor Beacons
      nodesRef.current.forEach((node) => {
        const pt = proj([node.lng, node.lat]);
        if (!pt) return;
        const isHive = node.type === 'HIVE';
        const isFocused = focusedNodeIdRef.current === node.id;
        const beaconColor = isHive ? '#ff3366' : '#10b981';
        const pulsePhase = ((now * 0.0014 + (isHive ? 0 : node.lng * 0.02)) % 1);

        // Expanding defense radar ring
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], (isHive ? 6 : 4) + pulsePhase * (isHive ? 18 : 12), 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(beaconColor, (1 - pulsePhase) * 0.65);
        ctx.lineWidth = isHive ? 1.6 : 1.1;
        ctx.stroke();

        // Rotating tactical bracket arcs around Hive
        if (isHive || isFocused) {
          const rot = now * 0.0012;
          ctx.save();
          ctx.translate(pt[0], pt[1]);
          ctx.rotate(rot);
          ctx.strokeStyle = hexToRgba(beaconColor, 0.8);
          ctx.lineWidth = 1.2;
          for (let q = 0; q < 4; q++) {
            ctx.beginPath();
            ctx.arc(0, 0, isHive ? 10 : 8, q * (Math.PI / 2) + 0.25, q * (Math.PI / 2) + 1.05);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Core beacon diamond/circle
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], isHive ? 4.8 : 3.6, 0, Math.PI * 2);
        ctx.fillStyle = beaconColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Clean monospace label
        const label = isHive
          ? '★ TAIPEI SEMOR-POT HIVE'
          : node.name
              .replace(/^(SEMOR-POT|TPOT)-(HIVE|SENSOR)-/i, '')
              .split(' ')[0];
        ctx.font = isHive
          ? '700 9.5px "JetBrains Mono", ui-monospace, monospace'
          : '600 8.5px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
        const textW = ctx.measureText(label).width;
        ctx.fillRect(pt[0] - textW / 2 - 4, pt[1] - 23, textW + 8, 13);
        ctx.fillStyle = isHive ? '#fda4af' : '#6ee7b7';
        ctx.fillText(label, pt[0], pt[1] - 13.5);
      });

      ctx.restore();

      // Update visible live beam counter every ~20 frames to avoid React re-render overhead
      if (frameTick % 20 === 0) {
        setLiveArcCount(projectilesRef.current.length);
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [dimensions, spawnProjectile, compact]);

  // Hit-testing helper for pointer hover & click
  const findHit = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const proj = projectionRef.current;

      // Priority 1: Check SEMOR-POT sensor nodes
      for (const node of nodesRef.current) {
        const pt = proj([node.lng, node.lat]);
        if (!pt) continue;
        if (Math.hypot(pt[0] - x, pt[1] - y) <= 15) {
          return { x: pt[0], y: pt[1], kind: 'node' as const, node };
        }
      }

      // Priority 2: Check active attack origin hotspots
      for (const atk of attacksRef.current.slice(0, 28)) {
        const pt = proj([atk.sourceLng, atk.sourceLat]);
        if (!pt) continue;
        if (Math.hypot(pt[0] - x, pt[1] - y) <= 13) {
          return { x: pt[0], y: pt[1], kind: 'attack' as const, attack: atk };
        }
      }

      return null;
    },
    []
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = findHit(e.clientX, e.clientY);
    setHoveredTarget(hit);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = findHit(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.kind === 'node' && hit.node && onSelectNode) {
      onSelectNode(hit.node);
    } else if (hit.kind === 'attack' && hit.attack && onSelectAttack) {
      onSelectAttack(hit.attack);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full rounded-xl border border-slate-800/90 bg-[#04070e] overflow-hidden select-none',
        heightClassName || (compact ? 'h-[340px]' : 'h-[470px]')
      )}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredTarget(null)}
        onClick={handleClick}
        className={cn('block w-full h-full', hoveredTarget ? 'cursor-pointer' : 'cursor-crosshair')}
      />

      {/* Top-Left Live Render Telemetry Overlay */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-3 rounded-lg bg-[#050914]/85 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 text-[11px] font-mono tabular-nums text-slate-300">
        <span className="text-rose-400 font-bold">SEMOR-POT LIVE</span>
        <span className="text-slate-600">·</span>
        <span>
          Active Arcs: <strong className="text-white">{liveArcCount}</strong>
        </span>
        <span className="text-slate-600">·</span>
        <span>
          Sensors: <strong className="text-emerald-400">{nodes.length}</strong>
        </span>
      </div>

      {/* Bottom Legend Overlay */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-3 bg-[#050914]/88 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 text-[10px] font-mono space-y-1.5 z-10 shadow-xl',
          compact ? 'right-3' : 'left-3'
        )}
      >
        <span className="text-slate-400 font-bold tracking-wider block mb-1">
          {legendTitle || (compact ? 'SEMOR-POT Threat Vectors' : 'SEMOR-POT 攻擊向量航道圖例')}
        </span>
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff3366] ring-2 ring-rose-500/30" />
          <span>SEMOR-POT Taipei Hive / 邊緣誘捕節點</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff2a55]" />
          <span>Dionaea SMB / MS17-010 / 惡意酬載</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a18]" />
          <span>Cowrie SSH / Telnet 暴力破解</span>
        </div>
        {!compact && (
          <>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
              <span>Conpot 工控 SCADA / Modbus 探測</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
              <span>Tanner Web / SQLi 注入攻擊</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f8e]" />
              <span>Log4pot JNDI 漏洞試探</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
          <span>Honeytrap / 掃描與 Web 誘捕探針</span>
        </div>
        {!compact && (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
            <span>NAC / 邊界防火牆已阻斷攔截</span>
          </div>
        )}
      </div>

      {/* Interactive Floating Hover Tooltip */}
      {hoveredTarget && (
        <div
          className="pointer-events-none absolute z-20 min-w-[210px] max-w-[270px] rounded-xl bg-[#070d1c]/95 backdrop-blur-md border border-cyan-500/40 p-3 shadow-2xl text-[11px] font-mono text-slate-200"
          style={{
            left: Math.min(Math.max(12, hoveredTarget.x + 14), Math.max(12, dimensions.width - 275)),
            top: Math.min(Math.max(12, hoveredTarget.y - 24), Math.max(12, dimensions.height - 135)),
          }}
        >
          {hoveredTarget.kind === 'node' && hoveredTarget.node && (
            <div className="space-y-1">
              <div className="font-bold text-emerald-300">{hoveredTarget.node.name}</div>
              <div className="text-slate-400 text-[10px]">{hoveredTarget.node.location}</div>
              <div className="text-slate-300 tabular-nums pt-1 border-t border-slate-800">
                Coords: {hoveredTarget.node.lat.toFixed(2)}, {hoveredTarget.node.lng.toFixed(2)}
              </div>
              {typeof hoveredTarget.node.attacksCapturedCount === 'number' && (
                <div className="text-rose-300 tabular-nums">
                  Captured: {hoveredTarget.node.attacksCapturedCount.toLocaleString()}
                </div>
              )}
              <div className="text-[9px] text-cyan-400 pt-0.5">Click to inspect SEMOR-POT node</div>
            </div>
          )}

          {hoveredTarget.kind === 'attack' && hoveredTarget.attack && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">{hoveredTarget.attack.sourceIp}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: getThreatVectorColor(hoveredTarget.attack.honeypot, hoveredTarget.attack.severity) }}
                >
                  {hoveredTarget.attack.severity}
                </span>
              </div>
              <div className="text-slate-400 text-[10px]">
                {hoveredTarget.attack.sourceCity}, {hoveredTarget.attack.sourceCountry} ({hoveredTarget.attack.sourceCountryCode})
              </div>
              <div className="pt-1 border-t border-slate-800 text-slate-300">
                {hoveredTarget.attack.honeypot} · {hoveredTarget.attack.protocol}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{hoveredTarget.attack.attackType}</div>
              <div className="text-[9px] text-cyan-400 pt-0.5">Click to open Attacker Dossier</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
