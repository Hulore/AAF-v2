from __future__ import annotations

from html import escape

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

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{escape(request.name)} active ability icon">
  <rect width="{width}" height="{height}" fill="{background}"/>
  <path d="M20 44 L42 22 H86 L108 44 V122 H20 Z" fill="{class_color}" stroke="#111111" stroke-width="8" stroke-linejoin="round"/>
  <rect x="32" y="54" width="64" height="52" rx="2" fill="#ffffff" stroke="#111111" stroke-width="5"/>
  <text x="{width / 2:.0f}" y="84" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#111111">{escape(request.id)}</text>
  <rect x="20" y="122" width="88" height="26" fill="{class_color}" stroke="#111111" stroke-width="6"/>
  <text x="42" y="140" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="18" fill="#111111">{escape(damage)}</text>
  <text x="84" y="140" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="18" fill="#ffffff">{escape(mana)}</text>
  <text x="{width / 2:.0f}" y="156" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#ffffff">{escape(request.frameType + upgraded)}</text>
</svg>"""
    return svg, warnings

