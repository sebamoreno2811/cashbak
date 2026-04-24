#!/usr/bin/env python3
"""
Render carousel HTML → PNG slides (1080×1080 cada uno).

Uso:
    python render.py                          # usa ./carousel.html, escribe en ../outputs/YYYY-MM-DD-tincada/
    python render.py carousel.html ../outputs/2026-05-01-calendario
"""
import asyncio
import sys
from datetime import date
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Falta Playwright. Instalar con:")
    print("  pip install playwright --break-system-packages")
    print("  python -m playwright install chromium")
    sys.exit(1)


HERE = Path(__file__).parent


async def render(html_path: Path, out_dir: Path, slide_ids=None):
    slide_ids = slide_ids or [f"s{i}" for i in range(1, 8)]
    out_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={"width": 1080, "height": 1080},
            device_scale_factor=2,  # retina
        )
        page = await context.new_page()
        await page.goto(f"file://{html_path.resolve()}", wait_until="networkidle")
        await page.evaluate("document.fonts.ready")
        await asyncio.sleep(1.5)  # deja respirar a las fonts

        for i, sid in enumerate(slide_ids, start=1):
            el = await page.query_selector(f"#{sid}")
            if not el:
                print(f"  !! slide #{sid} no encontrado")
                continue
            out_path = out_dir / f"slide-{i}.png"
            await el.screenshot(path=str(out_path))
            print(f"  ✓ slide-{i}.png  ({out_path.stat().st_size // 1024} KB)")

        await browser.close()
    print(f"\nCarrusel renderizado en:\n  {out_dir}")


def default_output_dir():
    """../outputs/YYYY-MM-DD-tincada/ por defecto."""
    return HERE.parent / "outputs" / f"{date.today().isoformat()}-tincada"


if __name__ == "__main__":
    html = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "carousel.html"
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else default_output_dir()
    asyncio.run(render(html, out))
