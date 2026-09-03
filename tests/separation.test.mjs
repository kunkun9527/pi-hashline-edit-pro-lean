import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";

process.env.HOME = mkdtempSync(join(tmpdir(), "pi-hashline-lean-test-"));

const jiti = createJiti(import.meta.url, { interopDefault: true });
const hashlineExtension = (await jiti.import("../index.ts")).default;
const collapsedDisplayService = Symbol.for(
  "@local/pi-collapsed-tools.display-service.v1",
);
const expectedTools = [
  "read",
  "replace",
  "insert",
  "anchor_grep",
  "undo_last_change",
];

function createPi(registered) {
  return {
    registerTool(tool) {
      registered.push(tool);
    },
    registerCommand() {},
    on() {},
    getActiveTools() {
      return ["read", "bash", "write", "grep", ...expectedTools];
    },
    getAllTools() {
      return [];
    },
    setActiveTools() {},
  };
}

function assertNoDescriptions(value) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoDescriptions(item);
    return;
  }
  if (!value || typeof value !== "object") return;
  assert.equal("description" in value, false);
  for (const child of Object.values(value)) assertNoDescriptions(child);
}

test("registers the upstream 3.0.1 tools with lean model-facing text", () => {
  const registered = [];
  const pi = createPi(registered);
  const originalRegisterTool = pi.registerTool;

  hashlineExtension(pi);

  assert.equal(pi.registerTool, originalRegisterTool);
  assert.deepEqual(registered.map((tool) => tool.name), expectedTools);

  for (const tool of registered) {
    assert.equal(typeof tool.description, "string");
    assert.ok(tool.description.length < 100, `${tool.name} description is not lean`);
    assert.equal("promptSnippet" in tool, false);
    assert.ok(Array.isArray(tool.promptGuidelines));
    assert.ok(tool.promptGuidelines.length > 0);
    assertNoDescriptions(tool.parameters);
    assert.ok(Reflect.ownKeys(tool.parameters).includes("~kind"));
    assert.ok(Object.values(tool.parameters.properties).every((property) =>
      Reflect.ownKeys(property).includes("~kind"),
    ));
  }

  const replace = registered.find((tool) => tool.name === "replace");
  assert.deepEqual(Object.keys(replace.parameters.properties), [
    "path",
    "remove_from",
    "remove_to",
    "replacement_lines",
  ]);
});

test("uses the optional local collapsed-display service without installing one", () => {
  const registered = [];
  const decorated = [];
  globalThis[collapsedDisplayService] = {
    version: 1,
    decorate(tool) {
      decorated.push(tool.name);
      return { ...tool, collapsedDisplayDecorated: true };
    },
  };

  try {
    hashlineExtension(createPi(registered));
  } finally {
    delete globalThis[collapsedDisplayService];
  }

  assert.deepEqual(decorated, expectedTools);
  assert.ok(registered.every((tool) => tool.collapsedDisplayDecorated === true));
  assert.equal(globalThis[collapsedDisplayService], undefined);
});
