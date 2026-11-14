import type { AnimationStyle, ParticlePreset } from '@/lib/types/animation';

export type CatalogFamily = '2D' | '3D' | 'HUD' | 'experimental' | 'particles' | 'scene';
export type ContentMode = 'single' | 'multi-word' | 'specialized';

export interface CatalogEntry {
  id: AnimationStyle | ParticlePreset;
  name: string;
  family: CatalogFamily;
  description: string;
  capabilities: readonly string[];
  contentMode: ContentMode;
  ownKeys: readonly string[];
  thumbnail: { kind: 'static-placeholder'; reference: string };
}

const text = (id: AnimationStyle, name: string, family: CatalogFamily = '2D'): CatalogEntry => ({
  id, name, family, description: `${name} para animación de texto`, capabilities: ['text', 'typography', 'appearance'],
  contentMode: 'single', ownKeys: [], thumbnail: { kind: 'static-placeholder', reference: id },
});

export const textTemplateCatalog = {
  typewriter: text('typewriter', 'Typewriter (Clásico)'), 'slide-in': text('slide-in', 'Slide In'), 'bubble-pop': text('bubble-pop', 'Bubble Pop'), glitch: text('glitch', 'Cyberpunk Glitch'),
  'wipe-reveal': text('wipe-reveal', 'Wipe Reveal'), 'blur-reveal': text('blur-reveal', 'Blur Reveal'), scramble: text('scramble', 'Scramble'), 'neon-pulse': text('neon-pulse', 'Neon Pulse'),
  'slide-reveal': text('slide-reveal', 'Slide Reveal'), follower: text('follower', 'Follower'), rotation: text('rotation', 'Rotation'), flicker: text('flicker', 'Flicker'),
  'flicker-outline-fill': text('flicker-outline-fill', 'Flicker Outline Fill'), 'kinetic-box-sequence': text('kinetic-box-sequence', 'Kinetic Box Sequence'), 'smooth-sliding': text('smooth-sliding', 'Smooth Sliding'),
  'shape-reveal': text('shape-reveal', 'Shape Reveal'), 'fly-through': text('fly-through', 'Fly Through', '3D'), 'clean-modern': text('clean-modern', 'Clean Modern'), 'bar-reveal': text('bar-reveal', 'Bar Reveal'),
  'follower-grow': text('follower-grow', 'Follower Grow'), 'viral-text': text('viral-text', 'Viral Text'), 'shake-flicker': text('shake-flicker', 'Shake Flicker'), 'blur-cascade': text('blur-cascade', 'Blur Cascade'),
  cinematic: text('cinematic', 'Cinematic'), 'apple-style': text('apple-style', 'Apple Style'), 'extruded-3d': text('extruded-3d', 'Extruded 3D', '3D'), 'word-highlight-tracker': text('word-highlight-tracker', 'Word Highlight Tracker'), 'paper-cutout-assemble': text('paper-cutout-assemble', 'Paper Cutout Assemble'), 'ink-stamp-print': text('ink-stamp-print', 'Ink Stamp Print'), 'variable-weight-wave': text('variable-weight-wave', 'Variable Weight Wave'), 'glyph-tile-assemble': text('glyph-tile-assemble', 'Glyph Tile Assemble'), 'dual-text-layers': text('dual-text-layers', 'Dual Text Layers'),
} satisfies Record<AnimationStyle, CatalogEntry>;

const background = (id: ParticlePreset, name: string, family: CatalogFamily = 'particles'): CatalogEntry => ({
  id, name, family, description: `${name} para fondo animado`, capabilities: ['background', 'color'], contentMode: 'single', ownKeys: [], thumbnail: { kind: 'static-placeholder', reference: id },
});

export const backgroundCatalog = {
  'imported-video-1': background('imported-video-1', 'Video Importado 1'),
  'imported-video-2': background('imported-video-2', 'Video Importado 2'),
  'imported-video-3': background('imported-video-3', 'Video Importado 3'),
  'imported-video-4': background('imported-video-4', 'Video Importado 4'),
  'imported-video-5': background('imported-video-5', 'AI Chip Seedance 2.5 · Horizontal 4K', 'scene'),
  'imported-video-6': background('imported-video-6', 'AI Chip Seedance 2.5 · Vertical 4K', 'scene'),
  'floating-dust': background('floating-dust', 'Floating Dust'), 'light-orbs': background('light-orbs', 'Light Orbs'), starfield: background('starfield', 'Starfield'), 'geometric-flow': background('geometric-flow', 'Geometric Flow'),
  'nebula-cinematic': background('nebula-cinematic', 'Nebula Cinematic'), 'fluid-ribbons': background('fluid-ribbons', 'Fluid Ribbons'), 'tech-network': background('tech-network', 'Tech Network'), 'inferno-tracer-burst': background('inferno-tracer-burst', 'Inferno Tracer Burst'), 'neon-data-vortex': background('neon-data-vortex', 'Neon Data Vortex'),
  'hud-command-center': background('hud-command-center', 'HUD Command Center', 'HUD'), 'cyan-system-matrix': background('cyan-system-matrix', 'Cyan System Matrix'), 'neural-circuit-core': background('neural-circuit-core', 'Neural Circuit Core'), 'quantum-lattice-flow': background('quantum-lattice-flow', 'Quantum Lattice Flow'), 'aurora-silk-waves': background('aurora-silk-waves', 'Aurora Silk Waves'),
  'ember-spark-rain': background('ember-spark-rain', 'Ember Spark Rain'), 'plasma-ring-tunnel': background('plasma-ring-tunnel', 'Plasma Ring Tunnel'), 'obsidian-gold-luxe': background('obsidian-gold-luxe', 'Obsidian Gold Luxe'), 'bio-lumina-veins': background('bio-lumina-veins', 'Bio Lumina Veins'), 'radar-sweep-grid': background('radar-sweep-grid', 'Radar Sweep Grid'),
  'matrix-code-rain': background('matrix-code-rain', 'Matrix Code Rain'), 'matrix-tunnel-flow': background('matrix-tunnel-flow', 'Matrix Tunnel Flow'), 'metaball-reactor': background('metaball-reactor', 'Metaball Reactor'), 'wireframe-constellation': background('wireframe-constellation', 'Wireframe Constellation'), 'prism-noise-shimmer': background('prism-noise-shimmer', 'Prism Noise Shimmer'),
  'prism-sphere-shimmer-3d': background('prism-sphere-shimmer-3d', 'Prism Sphere Shimmer 3D', '3D'), 'solar-wind-streaks': background('solar-wind-streaks', 'Solar Wind Streaks'), 'crystal-shard-drift': background('crystal-shard-drift', 'Crystal Shard Drift'), 'monochrome-moire': background('monochrome-moire', 'Monochrome Moiré'), 'electro-silk-tendrils': background('electro-silk-tendrils', 'Electro Silk Tendrils'),
  'halftone-wave-field': background('halftone-wave-field', 'Halftone Wave Field'), 'neon-bulb-alternation': background('neon-bulb-alternation', 'Neon Bulb Alternation'), 'bg3d-lowpoly-terrain': background('bg3d-lowpoly-terrain', 'Low Poly Terrain 3D', 'scene'), 'bg3d-crystal-shards': background('bg3d-crystal-shards', 'Crystal Shards 3D', 'scene'), 'retro-grid-forward': background('retro-grid-forward', 'Retro Grid Forward', '3D'),
  'stellar-depth-field': background('stellar-depth-field', 'Stellar Depth Field', '3D'),
} satisfies Record<ParticlePreset, CatalogEntry>;
