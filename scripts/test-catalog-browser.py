#!/usr/bin/env python3
"""Local browser matrix. All tracking, WhatsApp, videos and external requests intercepted."""

import argparse
import json
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

BASE = "/catalago/leilao-martendal-weekend-2026"
NAMES = {
    "machos": "Quarto de Milha - Martendal Weekend 2026",
    "femeas": "Fêmeas Elite - Martendal Weekend 2026",
    "matrizes": "Matrizes - Martendal Weekend 2026",
}
QUERY = "?utm_source=ig&utm_medium=paid&utm_campaign=weekend&utm_content=creative&utm_term=audience&campaign_id=c1&adset_id=a1&ad_id=ad1&traffic_source=Instagram"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3001")
parser.add_argument("--browser", help="Optional existing Chromium executable")
args = parser.parse_args()


def setup(browser, width):
    context = browser.new_context(
        viewport={"width": width, "height": 850}, reduced_motion="reduce"
    )
    events, external, errors = [], [], []

    def intercept(route):
        request = route.request
        if urlparse(request.url).path == "/api/public/track":
            events.append(request.post_data_json)
            route.fulfill(
                status=202, content_type="application/json", body='{"ok":true}'
            )
        elif urlparse(request.url).path.startswith("/_vercel/"):
            # Hosting-provided analytics is absent from the local Node server.
            route.fulfill(status=200, content_type="application/javascript", body="")
        elif request.url.startswith(args.url):
            route.continue_()
        else:
            external.append(request.url)
            route.fulfill(status=200, body="")

    context.route("**/*", intercept)
    context.add_init_script(
        "window.pixelCalls=[]; window.fbq=(...args)=>window.pixelCalls.push(args);"
    )
    page = context.new_page()
    def page_error(error):
        errors.append(str(error))
        print(f"BROWSER ERROR {page.url}: {error}", flush=True)
    page.on("pageerror", page_error)
    page.on("console", lambda message: page_error(f"{message.text} {message.location}") if message.type == "error" else None)
    page.on("response", lambda r: page_error(f"HTTP {r.status}: {r.url}") if r.url.startswith(args.url) and r.status >= 400 else None)
    return context, page, events, external, errors


def pixel(page, event):
    return page.evaluate("name=>window.pixelCalls.filter(c=>c[1]===name)", event)


def ready(page):
    page.wait_for_function("sessionStorage.getItem('martendal_session_id') !== null")
    if (
        urlparse(page.url).path.endswith(("/machos", "/femeas", "/matrizes"))
        or "/catalago/" not in page.url
    ):
        page.wait_for_function("window.pixelCalls.some(c=>c[1]==='ViewContent')")
    else:
        page.wait_for_function(
            "document.querySelector('.cat-select-card')?.getAttribute('href').includes('?')"
        )
    page.wait_for_timeout(250)
    page.wait_for_function("window.pixelCalls.some(c=>c[1]==='PageView')")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (
        "Horizontal overflow"
    )
    assert len(pixel(page, "1419927983569630")) == 1
    assert len(pixel(page, "PageView")) == 1
    assert (
        page.locator(
            'script[src="https://connect.facebook.net/en_US/fbevents.js"]'
        ).count()
        == 1
    )


def goto_lot(page, number):
    page.locator(".cat-search").fill(number)
    page.locator(".cat-list button").filter(has_text=f"Lote {number}").first.click()
    page.wait_for_function(
        "n => {const e=document.querySelector('#lote-'+n); return e && Math.abs(e.getBoundingClientRect().top-12)<5}",
        arg=number,
    )
    assert page.locator(".cat-list").count() == 0
    page.wait_for_function(
        "n => document.querySelector('.cat-cta').textContent.includes('lote '+n)",
        arg=number,
    )


def whatsapp(href, key, animal=None, number=None):
    parsed = urlparse(href)
    assert parsed.netloc == "wa.me" and parsed.path == "/554391463994"
    message = parse_qs(parsed.query)["text"][0]
    catalog = {"machos": "catálogo do", "femeas": "catálogo Fêmeas Elite do", "matrizes": "catálogo de Matrizes do"}[key]
    expected = (
        f"Olá, Bárbara! Vi o Lote {number} — {animal} no {catalog} Martendal Weekend 2026 e tenho interesse. Quero mais informações sobre este lote e também reservar minha mesa."
        if animal
        else f"Olá, Bárbara! Estou vendo o {catalog} Martendal Weekend 2026 e gostaria de mais informações. Também quero reservar minha mesa."
    )
    assert message == expected, message


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.browser)
    for width in [320, 375, 390, 768, 1440]:
        context, page, events, external, errors = setup(browser, width)
        for key, catalog_name in NAMES.items():
            print(f"START {width}px {key}",flush=True)
            page.goto(args.url + BASE + QUERY)
            ready(page)
            assert sum(e["event_type"] == "catalog_selector_view" for e in events) >= 1
            assert page.locator('.cat-select-card').count() == 3
            for slug, heading, date in [('machos','Quarto de Milha','12 de setembro'),('femeas','Fêmeas Elite','11 de setembro'),('matrizes','Matrizes','13 de setembro')]:
                text = page.locator(f'a[href*="/{slug}?"]').inner_text()
                assert heading.casefold() in text.casefold() and date.casefold() in text.casefold(), (slug,text)
            card = page.locator(f'a[href*="/{key}?"]')
            assert urlparse(card.get_attribute("href")).query == QUERY[1:]
            # Capture selection before navigation destroys the document.
            page.evaluate(
                "window.selectionCalls=[]; window.addEventListener('pagehide',()=>sessionStorage.setItem('selectionPixel',JSON.stringify(window.pixelCalls)))"
            )
            card.click()
            page.wait_for_url("**/" + key + "?*")
            ready(page)
            selected = [e for e in events if e["event_type"] == "catalog_selected"][-1]
            assert selected["catalog_key"] == key and selected["catalog_name"] is None
            calls = json.loads(
                page.evaluate("sessionStorage.getItem('selectionPixel')")
            )
            selection = [c for c in calls if c[1] == "CatalogSelected"]
            assert (
                len(selection) == 1 and selection[0][2]["catalog_name"] == catalog_name
            )
            assert selection[0][2]["campaign_id"] == "c1"
            assert pixel(page, "ViewContent")[0][2]["catalog_name"] == catalog_name
            assert (
                page.locator('link[rel="canonical"]')
                .get_attribute("href")
                .endswith("/" + key)
            )
            assert page.locator(".cat-page").first.evaluate(
                "e=>e.complete && e.naturalWidth>0"
            )
            assert page.locator('.cat-page[loading="lazy"]').count() > 20
            whatsapp(page.locator(".cat-cta").get_attribute("href"), key)
            page.locator(".cat-cta").click()
            page.wait_for_timeout(150)
            first, owner, number = {
                "machos": ("SPOOKS GOTTA SHINE", "MARCUS FERRARI", "01"),
                "femeas": ("REM1783M FIV GENETICA ADITIVA", "PECUARIA MARTENDAL", "01"),
                "matrizes": ("AVIDYA10 DA MARTENDAL", "PECUÁRIA MARTENDAL", "100"),
            }[key]
            for query in [first.split()[0], owner]:
                page.locator(".cat-search").fill(query)
                assert (
                    page.locator(".cat-list button").filter(has_text=first).count() == 1
                )
            goto_lot(page, number)
            lot = page.locator("#lote-" + number)
            whatsapp(
                lot.locator(".cat-interest").get_attribute("href"), key, first, number
            )
            whatsapp(page.locator(".cat-cta").get_attribute("href"), key, first, number)
            lot.locator(".cat-interest").click()
            lot.locator(".cat-video").click()
            page.wait_for_timeout(150)
            assert (
                pixel(page, "CatalogLotInterest")[-1][2]["catalog_name"] == catalog_name
            )
            assert (
                pixel(page, "CatalogVideoClick")[-1][2]["catalog_name"] == catalog_name
            )
            video_url = lot.locator(".cat-video").get_attribute("href")
            video_event = [e for e in events if e["event_type"] == "catalog_video_click"][-1]
            assert video_event["video_url"] == video_url and video_event["lot_number"] == number
            assert pixel(page, "CatalogVideoClick")[-1][2]["video_url"] == video_url
            assert all(
                c[2]["catalog_name"] == catalog_name for c in pixel(page, "Contact")
            )
            if key == "femeas":
                goto_lot(page, "27")
                assert (
                    page.locator("#lote-27 img").get_attribute("src")
                    == "/catalogo-femeas/p30.webp"
                )
            if key == "matrizes":
                print(f"CHECK {width}px Matrizes groups and search",flush=True)
                for query, target in [("LATIFA12 DA MARTENDAL", "102"), ("ILHA5 DA MARTENDAL", "104"), ("BATUTA11 DA MARTENDAL", "108"), ("ADELIA DA MARTENDAL", "146")]:
                    page.locator('.cat-search').fill(query)
                    assert page.locator('.cat-list button').count() == 1
                    assert ('Lote '+target).casefold() in page.locator('.cat-list button').inner_text().casefold()
                    page.locator('.cat-list button').click()
                    page.wait_for_function("n=>document.querySelector('.cat-cta').textContent.includes('lote '+n)",arg=target)
                for target, count in [('100',1),('102',2),('104',3),('108',4),('146',5),('185',2)]:
                    goto_lot(page,target)
                    assert page.locator('#lote-'+target+' img').count()==count
                goto_lot(page,'102')
                for index in [0,1,0,1]:
                    page.locator('#lote-102 img').nth(index).evaluate("e=>e.scrollIntoView({block:'start',behavior:'instant'})")
                    page.wait_for_timeout(150)
                views=lambda: [e for e in events if e['event_type']=='lot_view' and e.get('catalog_key')=='matrizes' and e.get('lot_number')=='102']
                assert len(views())==1, views()
                page.reload(); ready(page); goto_lot(page,'102')
                assert len(views())==1
                print(f"CHECK {width}px Matrizes page images",flush=True)
                # Every page loads successfully, including visually-only p174.
                assert page.locator('.cat-page').count()==174
                for n in [2,117,169,170,171,172,173,174]:
                    img=page.locator(f'img[src="/catalogo-matrizes/p{n:02}.webp"]')
                    img.evaluate("e=>e.scrollIntoView({block:'start',behavior:'instant'})")
                    img.evaluate("e=>Promise.race([e.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Image decode timeout: '+e.src)),15000))])")
                    assert img.evaluate('e=>e.complete && e.naturalWidth===1080 && e.naturalHeight===1920')
                page.evaluate("async()=>{for (const e of document.querySelectorAll('.cat-page')) {const response=await fetch(e.src);if(!response.ok)throw Error(e.src)}}")
                assert page.locator('#lote-185 img').last.get_attribute('src')=='/catalogo-matrizes/p169.webp'
            page.locator(".cat-search").fill(owner)
            page.get_by_role("button", name="Ver lotes", exact=True).click()
            first_number = {"femeas":"01", "machos":"-100", "matrizes":"100"}[key]
            page.wait_for_function(
                "n=>Math.abs(document.getElementById('lote-'+n).getBoundingClientRect().top-12)<5",
                arg=first_number,
            )
            assert not page.locator(".cat-list").count()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            for event in [
                "catalog_view",
                "lot_view",
                "lot_whatsapp_click",
                "catalog_whatsapp_click",
                "catalog_video_click",
            ]:
                matches = [
                    e
                    for e in events
                    if e["event_type"] == event and e.get("catalog_key") == key
                ]
                assert matches, (width, key, event)
                assert all(
                    e["catalog_name"] == catalog_name
                    and e["utm_campaign"] == "weekend"
                    and e["ad_id"] == "ad1"
                    for e in matches
                )
            for popup in context.pages[1:]:
                popup.close()
        # Same session: both 01s counted once; reload must not add another Fêmeas 01.
        ones = [
            e
            for e in events
            if e["event_type"] == "lot_view" and e.get("lot_number") == "01"
        ]
        assert {e["catalog_key"] for e in ones} == {"machos", "femeas"}
        assert len({e["session_id"] for e in ones}) == 1
        assert len(ones) == 2
        page.reload()
        ready(page)
        goto_lot(page, "102")
        assert (
            len(
                [
                    e
                    for e in events
                    if e["event_type"] == "lot_view" and e.get("lot_number") == "01"
                ]
            )
            == 2
        )
        assert not errors, errors
        print(
            f"PASS {width}px: selector, three catalogs, groups 1–5, all pages, B/C/D/E search, reload, searches, scroll, CTAs, videos, UTM, Pixel, internal tracking, session dedup, no overflow",
            flush=True,
        )
        context.close()
    # Squeeze remains isolated.
    context, page, events, external, errors = setup(browser, 390)
    page.goto(args.url + "/leilao-martendal-weekend-2026" + QUERY)
    ready(page)
    page.locator(".squeeze-cta").click()
    page.wait_for_timeout(200)
    assert {e["event_type"] for e in events} == {"page_view", "whatsapp_click"}
    assert all(
        e.get("catalog_name") is None and e.get("catalog_key") is None for e in events
    )
    assert not errors, errors
    print("PASS squeeze: original page_view/whatsapp_click, single Pixel init/PageView")
    context.close()
    browser.close()
