const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { execFileSync } = require("node:child_process");
const ts = require("typescript");
function gitShow(file) {
  try {
    return execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" });
  } catch (error) {
    // Some managed runners report EPERM after a successful child exit.
    if (error.code === "EPERM" && error.status === 0 && error.stdout) return error.stdout;
    throw error;
  }
}

// Compile actual clients/helpers in memory; no browser, credentials or generated files.
require.extensions[".ts"] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    filename,
  );
};
const load = Module.createRequire(path.resolve("src/lib/panel-data.ts"));
const { panelPeriodFilters, parsePanelQuery } = load("./panel-data.ts");
const clients = load("./panel-auth.ts");
const query = (value) => parsePanelQuery(new URLSearchParams(value), true);

async function main() {
  assert.deepEqual(panelPeriodFilters("all", "", ""), {});
  assert.equal(
    panelPeriodFilters("today", "", "", new Date("2026-10-05T03:59:59Z")).start_at,
    "2026-10-04T04:00:00.000Z",
  );
  assert.equal(
    panelPeriodFilters("today", "", "", new Date("2026-10-05T04:00:00Z")).start_at,
    "2026-10-05T04:00:00.000Z",
  );
  assert.deepEqual(panelPeriodFilters("yesterday", "", "", new Date("2026-01-01T12:00:00Z")), {
    start_at: "2025-12-31T04:00:00.000Z",
    end_at: "2026-01-01T04:00:00.000Z",
  });
  assert.equal(
    panelPeriodFilters("7d", "", "", new Date("2026-10-05T12:00:00Z")).start_at,
    "2026-09-29T04:00:00.000Z",
  );
  assert.deepEqual(panelPeriodFilters("custom", "2026-09-30", "2026-10-01"), {
    start_at: "2026-09-30T04:00:00.000Z",
    end_at: "2026-10-02T04:00:00.000Z",
  });
  for (const invalid of [
    "unknown=x",
    "source=a&source=b",
    "catalog_key=invalid",
    "experience=invalid",
    "event=invalid",
    "device=invalid",
    "cursor_id=bad",
    "page_size=101",
    "page_size=0",
    "start_at=invalid",
    "start_at=2026-02-30T00:00:00Z",
    "end_at=2026-02-29T00:00:00Z",
    "cursor_created_at=2026-04-31T00:00:00Z&cursor_id=00000000-0000-0000-0000-000000000001",
    "format=json",
  ])
    assert.throws(() => query(invalid));
  assert.equal(query("").pageSize, 100);
  assert.equal(
    query("start_at=2024-02-29T00:00:00-04:00").filters.start_at,
    "2024-02-29T00:00:00-04:00",
  );
  const filters = {
    source: "Facebook",
    campaign: "campanha",
    term: "termo",
    content: "conteúdo",
    experience: "catalog",
    catalog_key: "machos",
    device: "Mobile",
    event: "lot_view",
    lot: "machos:1",
    search: "animal",
    session_id: "session",
  };
  const calls = [];
  const summary = { total_events: 5101, accesses: 5101, uniques: 5101 };
  let pageIndex = 0;
  global.fetch = async (url) => {
    calls.push(url);
    if (url.startsWith("/api/panel/dashboard"))
      return Response.json({ ok: true, dashboard: { summary } });
    const params = new URL(url, "https://test.invalid").searchParams;
    for (const [key, value] of Object.entries(filters)) assert.equal(params.get(key), value);
    assert.equal(params.get("page_size"), "100");
    pageIndex += 1;
    return Response.json({
      ok: true,
      events: Array.from({ length: 100 }, (_, i) => ({ id: `${pageIndex}:${i}` })),
      hasMore: true,
      nextCursor: {
        created_at: "2026-10-05T09:00:00Z",
        id: "00000000-0000-0000-0000-000000000001",
      },
    });
  };
  const dashboard = await clients.panelGetDashboard(filters);
  const saved = JSON.stringify(dashboard);
  let cursor = null;
  const ids = new Set();
  for (let i = 0; i < 3; i++) {
    const result = await clients.panelGetTrackingEventsPage(cursor, filters);
    assert.equal(result.page.events.length, 100);
    result.page.events.forEach((event) => {
      assert(!ids.has(event.id));
      ids.add(event.id);
    });
    cursor = result.page.nextCursor;
    assert.equal(JSON.stringify(dashboard), saved);
  }
  assert.equal(calls.filter((url) => url.startsWith("/api/panel/dashboard")).length, 1);
  assert.equal(query(new URL(calls[2], "https://test.invalid").search).cursor.id, cursor.id);
  global.fetch = async () => Response.json({ ok: true, events: Array(101).fill({}) });
  assert.equal((await clients.panelGetTrackingEventsPage(null)).ok, false);

  const source = fs.readFileSync("src/routes/leads-panel.tsx", "utf8");
  assert(
    !/panelGetTrackingEvents\(|function groupBy|function groupCatalogBy|const \[rows,/.test(source),
  );
  const adapter = source.slice(
    source.indexOf("const summary = dashboard"),
    source.indexOf("const matchesSearch"),
  );
  assert(!/recentEvents|pageRows|timelinePage/.test(adapter));
  const navigation = source.slice(
    source.indexOf("async function changeEventsPage"),
    source.indexOf("const showCatalog"),
  );
  assert(!/panelGetDashboard|setDashboard|setRefresh/.test(navigation));
  assert(source.includes("session_id: timelineSession"));
  const original = gitShow("src/routes/leads-panel.tsx");
  const titles = [...original.matchAll(/title="([^"]+)"/g)].map((match) => match[0]);
  for (const title of titles) assert(source.includes(title), `Original UI title missing: ${title}`);
  const functions = (text) => {
    const file = ts.createSourceFile("module.ts", text, ts.ScriptTarget.Latest, true);
    return new Map(
      file.statements
        .filter(ts.isFunctionDeclaration)
        .map((node) => [
          node.name.text,
          ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, file),
        ]),
    );
  };
  const before = functions(gitShow("src/lib/panel-auth.ts"));
  const after = functions(fs.readFileSync("src/lib/panel-auth.ts", "utf8"));
  for (const name of ["panelLogin", "panelSessionValid", "panelLogout"])
    assert.equal(after.get(name), before.get(name));
  console.log(
    "PASS: timezone, validation, filter forwarding, 5101-event mock / pages <=100, independent pagination, original UI titles and unchanged auth. Mock is not SQL/UI validation.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
