from __future__ import annotations

from html import escape
import re
from pathlib import Path

from .assets import resolve_damage_type_asset, resolve_element_asset, resolve_upgraded_diamond_asset
from .layout import ElementLayout, load_icon_element_layout
from .models import AafIconRequest


def render_active_icon_svg(request: AafIconRequest) -> tuple[str, list[str]]:
    warnings: list[str] = [
        "Renderer uses a placeholder SVG until AAF v1 frame rendering is ported.",
    ]
    width = request.options.width
    height = request.options.height
    background = "none" if request.options.transparent else "#202124"
    class_color = request.classColor or "#8a3746"
    damage = "" if request.damage is None else str(request.damage)
    mana = "" if request.manaCost is None else str(request.manaCost)
    upgraded = " upgraded" if request.variant == "upgraded" else ""
    embedded_assets = embedded_icon_assets(request)

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{escape(request.name)} active ability icon">
  <rect width="{width}" height="{height}" fill="{background}"/>
  <path d="M20 44 L42 22 H86 L108 44 V122 H20 Z" fill="{class_color}" stroke="#111111" stroke-width="8" stroke-linejoin="round"/>
  <rect x="32" y="54" width="64" height="52" rx="2" fill="#ffffff" stroke="#111111" stroke-width="5"/>
  {embedded_assets}
  <text x="{width / 2:.0f}" y="84" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#111111">{escape(request.id)}</text>
  <rect x="20" y="122" width="88" height="26" fill="{class_color}" stroke="#111111" stroke-width="6"/>
  <text x="42" y="140" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="18" fill="#111111">{escape(damage)}</text>
  <text x="84" y="140" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="18" fill="#ffffff">{escape(mana)}</text>
  <text x="{width / 2:.0f}" y="156" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#ffffff">{escape(request.frameType + upgraded)}</text>
</svg>"""
    return svg, warnings


def embedded_icon_assets(request: AafIconRequest) -> str:
    snippets: list[str] = []
    layout = load_icon_element_layout()

    damage_asset = resolve_damage_type_asset(request.damageType)
    damage_layout = layout.elements.get("damage_type_icon")
    if damage_asset and damage_layout and damage_layout.visible:
        snippets.append(inline_svg(damage_asset, damage_layout, element_id="damage-type-icon"))

    element_asset = resolve_element_asset(request.element)
    element_layout = layout.elements.get("element_icon")
    if element_asset and element_layout and element_layout.visible:
        snippets.append(inline_svg(element_asset, element_layout, element_id="element-icon"))

    upgraded_layout = layout.elements.get("upgraded_diamond")
    if request.variant == "upgraded" and upgraded_layout and upgraded_layout.visible:
        snippets.append(
            inline_svg(
                resolve_upgraded_diamond_asset(),
                upgraded_layout,
                element_id="upgraded-diamond",
            )
        )

    return "\n  ".join(snippets)


def inline_svg(path: Path, layout: ElementLayout, *, element_id: str) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    source_width = parse_svg_dimension(text, "width") or layout.width
    source_height = parse_svg_dimension(text, "height") or layout.height
    inner = re.sub(r"^.*?<svg\b[^>]*>", "", text, count=1, flags=re.IGNORECASE | re.DOTALL)
    inner = re.sub(r"</svg>\s*$", "", inner, flags=re.IGNORECASE | re.DOTALL).strip()
    offset_x = -layout.width / 2 if layout.anchor == "center" else 0
    offset_y = -layout.height / 2 if layout.anchor == "center" else 0
    return (
        f'<g id="{escape(element_id)}" transform="translate({layout.x:g} {layout.y:g}) rotate({layout.rotation:g})">'
        f'<svg x="{offset_x:g}" y="{offset_y:g}" width="{layout.width:g}" height="{layout.height:g}" '
        f'viewBox="0 0 {source_width:g} {source_height:g}" overflow="visible">{inner}</svg></g>'
    )


def parse_svg_dimension(text: str, attr: str) -> float | None:
    match = re.search(rf'\b{attr}="([0-9.]+)(?:px)?"', text, flags=re.IGNORECASE)
    if not match:
        return None
    return float(match.group(1))
