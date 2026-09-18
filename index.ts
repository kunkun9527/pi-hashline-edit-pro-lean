// pi-hashline-edit-pro-lean2: full pi-hashline-edit-pro@4.3.5 runtime,
// with concise provider-facing tool/command text and local collapsed-display support.
//
// Design (same idea as pi-hashline-edit-pro-lean): delegate 100% of the
// runtime to upstream by calling its default export with a proxied `pi`.
// Only model-visible text differs: short tool descriptions, one-line
// guidelines, parameter schemas without per-field descriptions, and short
// command descriptions. Upstream behavior and error semantics stay intact.
//
// 4.3.5 contract change vs 3.x: replace/insert resolve the file from anchors
// alone (anchor-only). Do NOT pass `path` unless /hashline-config opted into
// requirePath. undo_last_change still requires `path`.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import upstream from "pi-hashline-edit-pro";

const COLLAPSED_DISPLAY_SERVICE = Symbol.for(
  "@local/pi-collapsed-tools.display-service.v1",
);

type CollapsedDisplayTool = { name: string };
type CollapsedDisplayService = {
  readonly version: 1;
  decorate<T extends CollapsedDisplayTool>(tool: T): T;
};

function decorateWithCollapsedDisplay<T extends CollapsedDisplayTool>(tool: T): T {
  const services = globalThis as unknown as Record<PropertyKey, unknown>;
  const candidate = services[COLLAPSED_DISPLAY_SERVICE];
  if (!candidate || typeof candidate !== "object") return tool;
  const service = candidate as Partial<CollapsedDisplayService>;
  return service.version === 1 && typeof service.decorate === "function"
    ? service.decorate(tool)
    : tool;
}

const DESC: Record<string, string> = {
  read: "Read a file with 4-char HASH anchors; supports paging and images.",
  replace: "Replace lines by bare 4-char HASH anchors; anchor-only, no path.",
  insert: "Insert raw lines around a bare 4-char HASH anchor; anchor-only.",
  undo_last_change: "Undo the most recent replace or insert for a file; needs path.",
  anchor_grep: "Search text with ripgrep; hits carry anchors for direct editing.",
};

const GUIDE: Record<string, string> = {
  read: "Use fresh anchors from read output; re-read after edits. E_AUTO_READ_ALL means the attached copy is still exact.",
  replace: "Anchors resolve the file; do not pass path unless parameters list it. replacement_lines is raw lines, one string per item, no HASH prefixes or newlines; [] deletes. Same-file calls in one message form one batch; follow +anchor rows in the diff. Re-read after failure.",
  insert: "Anchor resolves the file; do not pass path unless parameters list it. lines are raw, one string per item; the anchor line stays. Re-read after failure.",
  undo_last_change: "Needs path. Only the latest replace or insert per file; write clears it. Re-read if stale.",
  anchor_grep: "Use returned anchors directly in replace or insert; narrow path, glob, or limit.",
};

const CMD_DESC: Record<string, string> = {
  "hashline-config": "Open hashline settings: read, path, strict, diff.",
  "clear-anchors": "Clear session anchor claims; re-read to reclaim.",
};

const PARAMS = new Set(Object.keys(DESC));

type AnyTool = {
  name: string;
  description?: string;
  promptSnippet?: string;
  promptGuidelines?: string | string[];
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
};

type AnyCommand = {
  description?: string;
  [key: string]: unknown;
};

function toGuidelineLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function stripDescriptions(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripDescriptions);
  if (!value || typeof value !== "object") return value;

  const out = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(value)) {
    if (key === "description") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) continue;
    if ("value" in descriptor) descriptor.value = stripDescriptions(descriptor.value);
    Object.defineProperty(out, key, descriptor);
  }
  return out;
}

function trimTool(tool: AnyTool): AnyTool {
  const out: AnyTool = { ...tool };
  const name = out.name ?? "";
  if (DESC[name]) out.description = DESC[name];
  delete out.promptSnippet;
  if (GUIDE[name]) out.promptGuidelines = toGuidelineLines(GUIDE[name]);
  if (out.parameters && PARAMS.has(name)) {
    out.parameters = stripDescriptions(out.parameters) as Record<string, unknown>;
  }
  return out;
}

function trimCommand(name: string, cmd: AnyCommand): AnyCommand {
  if (!cmd || typeof cmd !== "object") return cmd;
  if (!CMD_DESC[name] || typeof cmd.description !== "string") return cmd;
  return { ...cmd, description: CMD_DESC[name] };
}

function leanPi(pi: ExtensionAPI): ExtensionAPI {
  return new Proxy(pi, {
    get(target, prop, receiver) {
      if (prop === "registerTool") {
        return (tool: AnyTool) => target.registerTool(
          decorateWithCollapsedDisplay(trimTool(tool)) as never,
        );
      }
      if (prop === "registerCommand") {
        const register = Reflect.get(target, prop, receiver) as unknown;
        if (typeof register !== "function") return register;
        return (name: string, cmd: AnyCommand) =>
          (register as (n: string, c: AnyCommand) => unknown).call(
            target,
            name,
            trimCommand(name, cmd),
          );
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// Full upstream lifecycle (session registry, auto-read-all, batch,
// config overlay, write hook) runs unchanged; only the text the model
// sees is trimmed by the proxy above.
export default function (pi: ExtensionAPI): void {
  upstream(leanPi(pi));
}
