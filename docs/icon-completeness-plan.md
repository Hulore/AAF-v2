# Icon Completeness Plan

The first practical V2 milestone should be icon completeness, because the website can only treat AAF as `complete` when generated icons match the intended active ability visuals.

## Start Here

1. Freeze the V2 request/result API.
2. Port AAF v1 frame rendering into `src/aaf_v2/renderer.py`.
3. Create a fixture set with one ability per visual case.
4. Compare generated icons against the current best AAF v1 output and game references.
5. Add missing elements as data-driven layout rules, not one-off SVG edits.

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
