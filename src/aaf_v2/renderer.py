from __future__ import annotations

from html import escape
import re
from pathlib import Path

from .assets import resolve_damage_type_asset, resolve_element_asset, resolve_upgraded_diamond_asset
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
    damage_asset = resolve_damage_type_asset(request.damageType)
    if damage_asset:
        snippets.append(inline_svg(damage_asset, x=22, y=124, width=14, height=24, element_id="damage-type-icon"))

    element_asset = resolve_element_asset(request.element)
    if element_asset:
        snippets.append(inline_svg(element_asset, x=94, y=124, width=13, height=13, element_id="element-icon"))

    if request.variant == "upgraded":
        snippets.append(
            inline_svg(
                resolve_upgraded_diamond_asset(),
                x=96,
                y=20,
                width=18,
                height=28,
                element_id="upgraded-diamond",
            )
        )

    return "\n  ".join(snippets)


def inline_svg(path: Path, *, x: float, y: float, width: float, height: float, element_id: str) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    source_width = parse_svg_dimension(text, "width") or width
    source_height = parse_svg_dimension(text, "height") or height
    inner = re.sub(r"^.*?<svg\b[^>]*>", "", text, count=1, flags=re.IGNORECASE | re.DOTALL)
    inner = re.sub(r"</svg>\s*$", "", inner, flags=re.IGNORECASE | re.DOTALL).strip()
    return (
        f'<svg id="{escape(element_id)}" x="{x:g}" y="{y:g}" width="{width:g}" height="{height:g}" '
        f'viewBox="0 0 {source_width:g} {source_height:g}" overflow="visible">{inner}</svg>'
    )


def parse_svg_dimension(text: str, attr: str) -> float | None:
    match = re.search(rf'\b{attr}="([0-9.]+)(?:px)?"', text, flags=re.IGNORECASE)
    if not match:
        return None
    return float(match.group(1))
