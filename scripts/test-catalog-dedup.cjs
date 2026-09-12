const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function load(file, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const output = {};
  new Function("require", "exports", source)((name) => dependencies[name], output);
  return output;
}
const contract = load("src/lib/catalog-tracking-contract.ts");
const storage = new Map([["martendal_session_id", "same-session"]]);
const bodies = [];
globalThis.window = {
  location: { pathname: "", search: "?utm_source=ig&campaign_id=c1&adset_id=a1&ad_id=ad1" },
  sessionStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  },
};
globalThis.document = { referrer: "" };
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { userAgent: "Desktop", sendBeacon: (_url, body) => (bodies.push(body), true) },
});
function tracker() {
  return load("src/lib/internal-tracking.ts", { "./catalog-tracking-contract": contract });
}
(async () => {
  let tracking = tracker();
  for (const catalog of Object.values(contract.CATALOGS)) {
    window.location.pathname = catalog.path;
    for (let page = 0; page < 5; page++) tracking.trackInternalLotViewOnce("102", "Test animal");
  }
  assert.equal(bodies.length, 3);
  tracking = tracker(); // Reload the module, retaining this tab's sessionStorage.
  tracking.trackInternalLotViewOnce("102", "Test animal");
  assert.equal(bodies.length, 3);
  tracking.trackInternalLotViewOnce("103", "Another animal");
  assert.equal(bodies.length, 4);
  const events = await Promise.all(bodies.map(async (body) => JSON.parse(await body.text())));
  assert.deepEqual(
    events.slice(0, 3).map((event) => event.catalog_key),
    ["machos", "femeas", "matrizes"],
  );
  assert.ok(events.every((event) => event.session_id === "same-session" && event.ad_id === "ad1"));
  assert.equal(events[3].catalog_name, contract.CATALOGS.matrizes.catalogName);
  storage.set("martendal_session_id", "new-session");
  tracking.trackInternalLotViewOnce("102", "Test animal");
  assert.equal(bodies.length, 5);
  console.log(
    "PASS: session + catalog + lot; three 102s, repeated pages, module reload, another lot, new session, attribution",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
