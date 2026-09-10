#!/usr/bin/env python3
"""Panel regression using synthetic RPC responses; never uses real credentials."""

import argparse
from datetime import datetime, timezone
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3001")
args = parser.parse_args()
base = "/catalago/leilao-martendal-weekend-2026"
rows = []
for key, name, animal, count in [
    ("machos", "Quarto de Milha - Martendal Weekend 2026", "SPOOKS GOTTA SHINE", 2),
    (
        "femeas",
        "Fêmeas Elite - Martendal Weekend 2026",
        "REM1783M FIV GENETICA ADITIVA",
        1,
    ),
]:
    for i, event in enumerate(
        ["catalog_view"]
        + ["lot_view"] * count
        + ["lot_whatsapp_click", "catalog_video_click"]
    ):
        rows.append(
            {
                "id": f"{key}-{i}",
                "event_type": event,
                "lot_number": None if event == "catalog_view" else "01",
                "horse_name": animal,
                "catalog_name": name,
                "catalog_key": key,
                "landing_path": base + "/" + key,
                "experience_type": "catalog",
                "session_id": "same-session" if i < 3 else "second-session",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "device_type": "Desktop",
                "traffic_source": "Instagram",
                "video_url": "https://youtu.be/test",
            }
        )
# Historical Machos root event must merge with Machos, not with selector or Fêmeas.
rows.append(
    dict(
        rows[1],
        id="legacy",
        catalog_key=None,
        landing_path=base,
        session_id="legacy-session",
    )
)
for event in ["catalog_selector_view", "catalog_selected"]:
    rows.append(
        dict(
            rows[0],
            id=event,
            event_type=event,
            horse_name=None,
            lot_number=None,
            catalog_key="femeas" if event == "catalog_selected" else None,
            catalog_name=None,
            landing_path=base,
        )
    )
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [320, 375, 390, 768, 1440]:
        context = browser.new_context(viewport={"width": width, "height": 850})

        def intercept(route):
            request = route.request
            path = urlparse(request.url).path
            if "/rest/v1/rpc/" in path:
                if path.endswith("panel_session_valid"):
                    result = {"valid": True, "email": "mock@example.invalid"}
                elif path.endswith("panel_get_tracking_events"):
                    result = rows
                else:
                    raise AssertionError("Unexpected administrative RPC " + path)
                import json

                route.fulfill(
                    status=200, content_type="application/json", body=json.dumps(result)
                )
            elif request.url.startswith(args.url):
                route.continue_()
            else:
                route.fulfill(status=200, body="")

        context.route("**/*", intercept)
        context.add_init_script(
            "sessionStorage.setItem('martendal_panel_token','synthetic-test-token')"
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e, errors=errors: errors.append(str(e)))
        page.goto(args.url + "/leads-panel")
        page.locator("td").get_by_text("Machos / Lote 01", exact=True).first.wait_for()
        assert page.get_by_text("Fêmeas Elite / Lote 01", exact=True).count() > 0
        assert page.get_by_text("Abriu a seleção de catálogos", exact=True).count() > 0
        assert page.get_by_text("Selecionou catálogo", exact=True).count() > 0
        for key, unique, total in [("Fêmeas Elite", 1, 1), ("Machos", 2, 3)]:
            cell = page.locator("td").get_by_text(key + " / Lote 01", exact=True).first
            tr = cell.locator("..")
            text = tr.inner_text()
            assert ("REM1783M" in text) == (key == "Fêmeas Elite")
            cell.click()
            drawer = page.locator(".fixed.inset-0.z-50")
            assert (
                drawer.get_by_text(
                    ("Fêmeas Elite" if key == "Fêmeas Elite" else "Quarto de Milha")
                    + " - Martendal Weekend 2026",
                    exact=True,
                ).count()
                == 1
            )
            assert drawer.get_by_text("Visualizações únicas", exact=True).locator(
                ".."
            ).inner_text().split()[-1] == str(unique)
            assert drawer.get_by_text("Visualizações totais", exact=True).locator(
                ".."
            ).inner_text().split()[-1] == str(total)
            drawer.get_by_role("button", name="Fechar", exact=True).click()
        assert not errors, errors
        print(
            f"PASS panel {width}px: separate 01s, historic Machos merge, drawer counts/name, selector labels, mocked auth",
            flush=True,
        )
        context.close()
    browser.close()
