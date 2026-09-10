const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
function load(file, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => dependencies[name] ?? require(name),
    module,
    module.exports,
  );
  return module.exports;
}
const contract = load("src/lib/catalog-tracking-contract.ts");
let inserted;
let backendError = null;
const { Route } = load("src/routes/api/public/track.ts", {
  "@/lib/catalog-tracking-contract": contract,
  "@/integrations/supabase/config": {
    SUPABASE_URL: "https://mock.invalid",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  },
  "@tanstack/react-router": { createFileRoute: () => (options) => options },
  "@supabase/supabase-js": {
    createClient: () => ({
      from: () => ({
        insert: async (payload) => {
          inserted = payload;
          return { error: backendError };
        },
      }),
    }),
  },
});
const post = (body) =>
  Route.server.handlers.POST({
    request: new Request("http://localhost/api/public/track", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
for (const existing of [false, true]) {
  const scripts = [];
  globalThis.window = {};
  if (existing) {
    const calls = [];
    globalThis.window.fbq = (...args) => calls.push(args);
    globalThis.window.fbq.queue = calls;
  }
  globalThis.document = {
    querySelector: () => scripts[0] ?? null,
    createElement: () => ({ dataset: {} }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  const pixel = load("src/lib/meta-pixel.ts", {
    "./squeeze-config": { META_PIXEL_ID: "1419927983569630" },
  });
  pixel.ensureMetaPixel();
  pixel.ensureMetaPixel();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.deepEqual(globalThis.window.fbq.queue, [
    ["init", "1419927983569630"],
    ["track", "PageView"],
  ]);
}
delete globalThis.window;
delete globalThis.document;
console.log("PASS Pixel bootstrap: stub and preexisting fbq; one loader/init/PageView");

(async () => {
  const cases = JSON.parse(fs.readFileSync("scripts/tracking-test-cases.json"));
  for (const [index, row] of cases.entries()) {
    const { accept, ...fields } = row;
    inserted = null;
    const body = {
      ...fields,
      session_id: "test-session",
      traffic_source: "Instagram",
      device_type: "Mobile",
      catalog_name: "WRONG",
      utm_source: "ig",
      utm_medium: "paid",
      utm_campaign: "weekend",
      utm_content: "creative",
      utm_term: "audience",
      campaign_id: "c1",
      adset_id: "a1",
      ad_id: "ad1",
      arbitrary: "must not reach backend",
    };
    const response = await post(body);
    assert.equal(response.status, accept ? 202 : 400, `case ${index}`);
    if (accept) {
      const catalog = contract.catalogForPath(body.landing_path);
      assert.equal(inserted.catalog_name, catalog?.catalogName ?? null);
      assert.equal(
        inserted.catalog_key,
        catalog?.catalogKey ??
          (fields.event_type === "catalog_selected" ? fields.catalog_key : null),
      );
      for (const key of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
        "campaign_id",
        "adset_id",
        "ad_id",
      ])
        assert.equal(inserted[key], body[key]);
      assert.equal(inserted.arbitrary, undefined);
    } else assert.equal(inserted, null);
  }
  const valid = {
    event_type: "lot_view",
    landing_path: contract.CATALOGS.femeas.path,
    lot_number: "01",
    horse_name: "Test",
    session_id: "test",
    traffic_source: "Meta",
    device_type: "Desktop",
  };
  backendError = { code: "23505" };
  assert.equal((await post(valid)).status, 202);
  backendError = null;
  assert.equal((await post({ ...valid, device_type: "Bad" })).status, 400);
  assert.equal((await post({ ...valid, session_id: "" })).status, 400);
  assert.equal((await post("x".repeat(16385))).status, 413);
  assert.equal((await post("{bad")).status, 400);
  assert.equal((await post(null)).status, 400);
  console.log(
    `PASS: ${cases.length} route/event cases; metadata, UTMs, context, 16KB, device, malformed JSON, duplicate 23505`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
