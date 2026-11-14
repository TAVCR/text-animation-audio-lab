'use client';

import React from 'react';
import { defaultAnimationProps, useAnimation } from '@/lib/AnimationContext';
import { Accordion, CompactCheckbox, FieldRow, InlineNumberRow, InlineRangeRow, compactInputClass, compactSelectClass } from './primitives';

const FONT_OPTIONS = [
  'Poppins',
  'Montserrat',
  'Oswald',
  'Inter',
  'Roboto',
  'Open Sans',
  'Bebas Neue',
  'Anton',
  'Orbitron',
  'Playfair Display',
];

const ANIMATION_STYLE_OPTIONS = [
  ['typewriter', 'Typewriter'],
  ['slide-in', 'Slide-In'],
  ['bubble-pop', 'Bubble Pop'],
  ['glitch', 'Glitch'],
  ['wipe-reveal', 'Wipe Reveal'],
  ['blur-reveal', 'Blur Reveal'],
  ['scramble', 'Scramble'],
  ['neon-pulse', 'Neon Pulse'],
  ['slide-reveal', 'Slide Reveal'],
  ['follower', 'Follower'],
  ['rotation', 'Rotation'],
  ['flicker', 'Flicker'],
  ['flicker-outline-fill', 'Flicker Outline Fill'],
  ['kinetic-box-sequence', 'Kinetic Box Sequence'],
  ['smooth-sliding', 'Smooth Sliding'],
  ['shape-reveal', 'Shape Reveal'],
  ['fly-through', 'Fly Through'],
  ['clean-modern', 'Clean Modern'],
  ['bar-reveal', 'Bar Reveal'],
  ['follower-grow', 'Follower Grow'],
  ['viral-text', 'Viral Text'],
  ['shake-flicker', 'Shake Flicker'],
  ['blur-cascade', 'Blur Cascade'],
  ['cinematic', 'Cinematic'],
  ['apple-style', 'Apple Style'],
  ['extruded-3d', 'Extruded 3D'],
] as const;

const FONT_3D_PRESETS = [
  ['auto', 'Auto'],
  ['helvetiker-regular', 'Helvetiker Regular'],
  ['helvetiker-bold', 'Helvetiker Bold'],
  ['optimer-regular', 'Optimer Regular'],
  ['optimer-bold', 'Optimer Bold'],
  ['gentilis-regular', 'Gentilis Regular'],
  ['gentilis-bold', 'Gentilis Bold'],
  ['droid-serif-regular', 'Droid Serif Regular'],
  ['droid-serif-bold', 'Droid Serif Bold'],
  ['droid-mono', 'Droid Mono'],
] as const;

const WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold'];

export default function Text3DTab() {
  const { props, setProps } = useAnimation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, type } = target;

    if (type === 'checkbox' && target instanceof HTMLInputElement) {
      setProps((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }

    const raw = target.value;
    const defaultValue = defaultAnimationProps[name as keyof typeof defaultAnimationProps];

    let value: unknown = raw;
    if (typeof defaultValue === 'number') {
      const parsed = Number(raw);
      value = Number.isFinite(parsed) ? parsed : defaultValue;
    }

    setProps((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-2">
      <Accordion title="Typography" storageKey="text3d-typography">
        <FieldRow label="Animation Style">
          <select name="animationStyle" value={props.animationStyle} onChange={handleChange} className={compactSelectClass}>
            {ANIMATION_STYLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Primary Text">
          <textarea name="text" value={props.text} onChange={handleChange} rows={2} className={`${compactInputClass} h-auto py-1.5`} />
        </FieldRow>

        <div className="grid grid-cols-2 gap-1.5">
          <CompactCheckbox
            checked={props.showWordTwo}
            onChange={(e) => setProps((prev) => ({ ...prev, showWordTwo: e.target.checked }))}
            label="Show Word 2"
          />
          <CompactCheckbox
            checked={props.showWordThree}
            onChange={(e) => setProps((prev) => ({ ...prev, showWordThree: e.target.checked }))}
            label="Show Word 3"
          />
        </div>

        {props.showWordTwo ? (
          <FieldRow label="Word 2">
            <input name="wordTwo" value={props.wordTwo} onChange={handleChange} className={compactInputClass} />
          </FieldRow>
        ) : null}
        {props.showWordThree ? (
          <FieldRow label="Word 3">
            <input name="wordThree" value={props.wordThree} onChange={handleChange} className={compactInputClass} />
          </FieldRow>
        ) : null}

        <InlineNumberRow
          items={[
            {
              label: 'Font 1',
              control: (
                <select name="fontFamily" value={props.fontFamily} onChange={handleChange} className={compactSelectClass}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              label: 'Weight 1',
              control: (
                <select name="fontWeight" value={props.fontWeight} onChange={handleChange} className={compactSelectClass}>
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              label: 'Size 1',
              control: <input type="number" name="fontSize" value={props.fontSize} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <InlineNumberRow
          items={[
            {
              label: 'Font 2',
              control: (
                <select name="fontFamilyTwo" value={props.fontFamilyTwo} onChange={handleChange} className={compactSelectClass}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              label: 'Weight 2',
              control: (
                <select name="fontWeightTwo" value={props.fontWeightTwo} onChange={handleChange} className={compactSelectClass}>
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              label: 'Size 2',
              control: <input type="number" name="fontSizeTwo" value={props.fontSizeTwo} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <InlineNumberRow
          items={[
            {
              label: 'Font 3',
              control: (
                <select name="fontFamilyThree" value={props.fontFamilyThree} onChange={handleChange} className={compactSelectClass}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              label: 'Weight 3',
              control: (
                <select name="fontWeightThree" value={props.fontWeightThree} onChange={handleChange} className={compactSelectClass}>
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              label: 'Size 3',
              control: <input type="number" name="fontSizeThree" value={props.fontSizeThree} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />
      </Accordion>

      <Accordion title="Color & Styling" storageKey="text3d-colors">
        <InlineNumberRow
          items={[
            { label: 'Color 1', control: <input type="color" name="color" value={props.color} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
            { label: 'Color 2', control: <input type="color" name="colorTwo" value={props.colorTwo} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
            { label: 'Color 3', control: <input type="color" name="colorThree" value={props.colorThree} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
          ]}
        />

        <div className="grid grid-cols-3 gap-1.5">
          <CompactCheckbox checked={props.enableBorder} onChange={(e) => setProps((prev) => ({ ...prev, enableBorder: e.target.checked }))} label="Border 1" />
          <CompactCheckbox checked={props.enableBorderTwo} onChange={(e) => setProps((prev) => ({ ...prev, enableBorderTwo: e.target.checked }))} label="Border 2" />
          <CompactCheckbox checked={props.enableBorderThree} onChange={(e) => setProps((prev) => ({ ...prev, enableBorderThree: e.target.checked }))} label="Border 3" />
        </div>

        <InlineNumberRow
          items={[
            {
              label: 'Border 1',
              control: <input type="number" name="borderWidth" value={props.borderWidth} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Border 2',
              control: <input type="number" name="borderWidthTwo" value={props.borderWidthTwo} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Border 3',
              control: <input type="number" name="borderWidthThree" value={props.borderWidthThree} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <div className="grid grid-cols-3 gap-1.5">
          <CompactCheckbox checked={props.enableShadow} onChange={(e) => setProps((prev) => ({ ...prev, enableShadow: e.target.checked }))} label="Shadow 1" />
          <CompactCheckbox checked={props.enableShadowTwo} onChange={(e) => setProps((prev) => ({ ...prev, enableShadowTwo: e.target.checked }))} label="Shadow 2" />
          <CompactCheckbox checked={props.enableShadowThree} onChange={(e) => setProps((prev) => ({ ...prev, enableShadowThree: e.target.checked }))} label="Shadow 3" />
        </div>

        <InlineNumberRow
          items={[
            {
              label: 'Shadow Blur 1',
              control: <input type="number" name="shadowBlur" value={props.shadowBlur} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Shadow Blur 2',
              control: <input type="number" name="shadowBlurTwo" value={props.shadowBlurTwo} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Shadow Blur 3',
              control: <input type="number" name="shadowBlurThree" value={props.shadowBlurThree} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />
      </Accordion>

      <Accordion title="Transform" storageKey="text3d-transform">
        <InlineNumberRow
          items={[
            {
              label: 'Spacing 1',
              control: <input type="number" step="0.1" name="letterSpacing" value={props.letterSpacing} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Spacing 2',
              control: <input type="number" step="0.1" name="letterSpacingTwo" value={props.letterSpacingTwo} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Spacing 3',
              control: <input type="number" step="0.1" name="letterSpacingThree" value={props.letterSpacingThree} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />
        <InlineNumberRow
          items={[
            {
              label: 'Line 1',
              control: <input type="number" step="0.05" name="lineHeight" value={props.lineHeight} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Line 2',
              control: <input type="number" step="0.05" name="lineHeightTwo" value={props.lineHeightTwo} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Line 3',
              control: <input type="number" step="0.05" name="lineHeightThree" value={props.lineHeightThree} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <InlineRangeRow axis="X" value={`${props.textPositionX.toFixed(0)}%`}>
          <input type="range" min="-45" max="45" step="1" name="textPositionX" value={props.textPositionX} onChange={handleChange} className="w-full" />
        </InlineRangeRow>
        <InlineRangeRow axis="Y" value={`${props.textPositionY.toFixed(0)}%`}>
          <input type="range" min="-45" max="45" step="1" name="textPositionY" value={props.textPositionY} onChange={handleChange} className="w-full" />
        </InlineRangeRow>
      </Accordion>

      <Accordion title="3D" storageKey="text3d-3d">
        <CompactCheckbox
          checked={props.useFont3dOverride}
          onChange={(e) => setProps((prev) => ({ ...prev, useFont3dOverride: e.target.checked }))}
          label="Use 3D Font Override"
        />

        <FieldRow label="Font 3D Preset">
          <select name="font3dPreset" value={props.font3dPreset} onChange={handleChange} className={compactSelectClass}>
            {FONT_3D_PRESETS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FieldRow>

        <InlineNumberRow
          items={[
            {
              label: 'Extrude',
              control: <input type="number" step="0.1" name="extrudeDepth3d" value={props.extrudeDepth3d} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Spacing',
              control: <input type="number" step="0.1" name="letterSpacing3d" value={props.letterSpacing3d} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Line Height',
              control: <input type="number" step="0.05" name="lineHeight3d" value={props.lineHeight3d} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <InlineNumberRow
          items={[
            {
              label: 'Metal Preset',
              control: (
                <select name="metalPreset" value={props.metalPreset} onChange={handleChange} className={compactSelectClass}>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="bronze">Bronze</option>
                </select>
              ),
            },
            {
              label: 'Metal Tone',
              control: (
                <select name="metalTone" value={props.metalTone} onChange={handleChange} className={compactSelectClass}>
                  <option value="light">Light</option>
                  <option value="classic">Classic</option>
                  <option value="rich">Rich</option>
                  <option value="aged">Aged</option>
                </select>
              ),
            },
            {
              label: 'Brightness',
              control: <input type="number" step="0.05" name="metalBrightness" value={props.metalBrightness} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <FieldRow label="Metal Contrast">
          <input type="number" step="0.05" name="metalContrast" value={props.metalContrast} onChange={handleChange} className={compactInputClass} />
        </FieldRow>
      </Accordion>
    </div>
  );
}
