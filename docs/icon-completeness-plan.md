# Icon Completeness Plan

The first practical V2 milestone should be icon completeness, because the website can only treat AAF as `complete` when generated icons match the intended active ability visuals.

## Start Here

1. Freeze the V2 request/result API.
2. Port AAF v1 frame rendering into `src/aaf_v2/renderer.py`.
3. Manually place the new icon elements in the per-frame files under `data/layouts/`.
4. Create a fixture set with one ability per visual case.
5. Compare generated icons against the current best AAF v1 output and game references.
6. Add missing elements as data-driven layout rules, not one-off SVG edits.

## Fixture Set

Use a small but representative set first:

- `BloodMagic`: damage + mana, upgraded text/overlay.
- `Regurge`: mana-only.
- `Ram`: normal damage + mana, upgraded multi-damage + mana.
- `ForbiddenFart`: colorless, unusual main SVG depth case.
- `Declaw`: class-aware manifest alias case.
- `RockSong`: tank class alias case.
- `TriggerTheNuke`: item text/source case.
- One Jester ability: class shader/rainbow behavior.

## Frame Editors

Each `frameType` has its own V2 element layout file and editor:

- `damage-mana`: `data/layouts/icon-elements.damage-mana.json`, `tools/v2_damage_mana_layout_editor.html`
- `multi-damage-mana`: `data/layouts/icon-elements.multi-damage-mana.json`, `tools/v2_multi_damage_mana_layout_editor.html`
- `mana`: `data/layouts/icon-elements.mana.json`, `tools/v2_mana_layout_editor.html`

The old AAF frame layout is rendered as the background/reference. The editable layers are the V2 additions: damage type icon, elemental icon row, and upgraded diamond.

## Known Icon Areas To Audit

- Frame variants: mana, damage-mana, multi-damage-mana.
- Main picture box scaling and anchoring.
- Damage type icon selection and centering.
- Mana icon selection and centering.
- Top active icon selection and per-icon positioning.
- Upgraded overlay placement and class-color recolor.
- Upgraded diamond placement.
- Class frame recolor, including Jester shader.
- Element-specific visuals.
- Special number strings: `X`, `?`, `N/A`, `1x10`, formulas.

## Recommended Rule

Do not manually edit final generated SVG output. If an icon is wrong, fix one of these instead:

- request data
- asset mapping
- layout preset
- renderer code
