from __future__ import annotations

from pathlib import Path

from .models import AafIconRequest, AafIconResult
from .renderer import render_active_icon_svg
from .validation import validate_request


def preview_active_icon(request: AafIconRequest) -> AafIconResult:
    validation_warnings, errors = validate_request(request)
    if errors:
        return AafIconResult(ok=False, warnings=validation_warnings, errors=errors)

    svg, render_warnings = render_active_icon_svg(request)
    return AafIconResult(ok=True, svg=svg, warnings=validation_warnings + render_warnings)


def generate_active_icon(request: AafIconRequest, output_path: str | Path) -> AafIconResult:
    preview = preview_active_icon(request)
    if not preview.ok or preview.svg is None:
        return preview

    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(preview.svg, encoding="utf-8")
    return AafIconResult(
        ok=True,
        outputPath=str(path),
        warnings=preview.warnings,
        errors=preview.errors,
    )

