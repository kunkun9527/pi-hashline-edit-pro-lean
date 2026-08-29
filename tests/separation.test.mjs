import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { interopDefault: true });
const hashlineExtension = (await jiti.import("../index.ts")).default;

test("Hashline registers only its editing behavior and does not install a global display interceptor", () => {
  const registered = [];
  const pi = {
    registerTool(tool) {
      registered.push(tool);
    },
    registerCommand() {},
    on() {},
    getActiveTools() {
      return ["read", "bash", "write", "replace", "undo_last_replace"];
    },
    getAllTools() {
      return [];
    },
    setActiveTools() {},
  };
  const originalRegisterTool = pi.registerTool;

  hashlineExtension(pi);

  assert.equal(pi.registerTool, originalRegisterTool);
  assert.deepEqual(registered.map((tool) => tool.name), ["read", "replace", "undo_last_replace"]);
});
