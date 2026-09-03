// pi-hashline-edit-pro-lean: full runtime from pi-hashline-edit-pro,
// with concise provider-facing tool text and local collapsed-display support.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES } from "@earendil-works/pi-coding-agent";
import { initHasher, MAX_HASH_LINES } from "pi-hashline-edit-pro/src/hashline";
import { regReplace } from "pi-hashline-edit-pro/src/replace";
import { regInsert } from "pi-hashline-edit-pro/src/insert";
import { regGrep } from "pi-hashline-edit-pro/src/grep";
import { regUndo, clearUndo } from "pi-hashline-edit-pro/src/replace-undo";
import { regRead, fmtReadPreview } from "pi-hashline-edit-pro/src/read";
import type { RMetrics } from "pi-hashline-edit-pro/src/replace-response";
import { extractWarnings } from "pi-hashline-edit-pro/src/replace-render";
import {
  readConfig,
  toggleAutoRead,
  toggleAnchorGrep,
} from "pi-hashline-edit-pro/src/config";
import { loadHashStore, pruneMissing } from "pi-hashline-edit-pro/src/hash-store";
import {
  recordServedSafe,
  clearServed,
  buildServedMap,
} from "pi-hashline-edit-pro/src/served";
import { clearBoundaryBypass } from "pi-hashline-edit-pro/src/boundary-bypass";
import { registerWriteHook } from "pi-hashline-edit-pro/src/write-hook";
import { readNormFile } from "pi-hashline-edit-pro/src/file-reader";
import { loadFileKindAndText } from "pi-hashline-edit-pro/src/file-kind";
import { resolveInCwd } from "pi-hashline-edit-pro/src/fs-write";
import { valAccess } from "pi-hashline-edit-pro/src/validation";
import { splitLines } from "pi-hashline-edit-pro/src/utils";

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
  read: "Read a file with 4-char HASH anchors for safe edits; supports paging and images.",
  replace: "Replace an inclusive anchored line range with bare replacement lines.",
  insert: "Insert bare lines before or after an anchored line.",
  undo_last_change: "Undo the most recent replace or insert for a file.",
  anchor_grep: "Search text with ripgrep and return 4-char anchors for direct editing.",
};

const GUIDE: Record<string, string> = {
  read: "Copy anchors from the left column; never invent them. Re-read after external file changes.",
  replace: "- remove_from/remove_to are bare 4-char anchors; the range is inclusive.\n- replacement_lines is one string per line: [] deletes; [\"\"] inserts one blank line; do not embed newlines.\n- Keep ranges tight. Apply one edit, inspect its diff, then continue with fresh anchors from that diff or re-read.",
  insert: "- Use a bare 4-char anchor and direction before/after; the anchor line remains.\n- lines is one string per inserted line; do not embed newlines. For an empty file, insert after its sole empty-line anchor.\n- Apply one edit and inspect its diff before continuing.",
  undo_last_change: "Only the latest replace or insert for a file can be undone; write clears history. Undo immediately after a bad diff. If undo is stale, re-read instead of forcing it.",
  anchor_grep: "Returned anchors can be used directly by replace or insert. Narrow path/glob/context and prefer literal search when regex is unnecessary.",
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

function leanPi(pi: ExtensionAPI): ExtensionAPI {
  return new Proxy(pi, {
    get(target, prop, receiver) {
      if (prop === "registerTool") {
        return (tool: AnyTool) => target.registerTool(
          decorateWithCollapsedDisplay(trimTool(tool)) as never,
        );
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// Keep this lifecycle aligned with the pinned upstream index.ts. Only tool text
// and optional local display decoration differ from upstream behavior.
export default function (pi: ExtensionAPI): void {
  const lpi = leanPi(pi);

  regRead(lpi);
  regReplace(lpi);
  regInsert(lpi);
  regGrep(lpi);
  regUndo(lpi);
  registerWriteHook(pi);

  let autoRead = true;
  let grepWasActive = false;

  pi.on("session_start", async (_event, ctx) => {
    const active = pi.getActiveTools();
    grepWasActive = active.includes("grep");
    pi.setActiveTools(active.filter((tool) => tool !== "edit"));
    await initHasher();
    loadHashStore()
      .then((store) =>
        pruneMissing(store).catch((error) => {
          console.error("Failed to prune hash store:", error);
        }),
      )
      .catch((error) => {
        console.error("Failed to load hash store:", error);
      });
    const config = await readConfig();
    autoRead = config.autoRead;
    pi.setActiveTools(
      pi.getActiveTools().filter((tool) =>
        config.anchorGrepEnabled ? tool !== "grep" : tool !== "anchor_grep",
      ),
    );
    const debugValue = process.env.PI_HASHLINE_DEBUG;
    if (debugValue === "1" || debugValue === "true") {
      ctx.ui.notify("Hashline Edit mode active", "info");
    }
  });

  pi.registerCommand("toggle-auto-read", {
    description: "Toggle auto-read anchors after write and post-edit diffs after replace, insert, and undo_last_change",
    handler: async (_args, ctx) => {
      autoRead = await toggleAutoRead();
      const state = autoRead ? "enabled" : "disabled";
      ctx.ui.notify(`Auto-read anchors after write and post-edit diffs after replace/undo: ${state}`, "info");
    },
  });

  pi.registerCommand("toggle-anchor-grep", {
    description: "Enable or disable anchor_grep (built-in grep is disabled while it is on)",
    handler: async (_args, ctx) => {
      const enabled = await toggleAnchorGrep();
      const active = pi.getActiveTools();
      pi.setActiveTools(
        enabled
          ? [...new Set([...active.filter((tool) => tool !== "grep"), "anchor_grep"])]
          : [...new Set([
              ...active.filter((tool) => tool !== "anchor_grep"),
              ...(grepWasActive ? ["grep"] : []),
            ])],
      );
      ctx.ui.notify(`anchor_grep tool ${enabled ? "enabled" : "disabled"}`, "info");
    },
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.isError) return;

    if (event.toolName === "write") {
      const writtenPath = (event.input as Record<string, unknown>)?.path;
      let resolvedPath: string | undefined;
      if (typeof writtenPath === "string") {
        try {
          resolvedPath = (await resolveInCwd(writtenPath, ctx.cwd)).resolved;
          await clearUndo(resolvedPath);
          clearBoundaryBypass(resolvedPath);
          const store = await loadHashStore();
          clearServed(store, resolvedPath);
        } catch (error) {
          console.error("Failed to clear undo after write:", error);
        }
      }
      if (!autoRead) return;
      if (typeof writtenPath !== "string") return;
      try {
        resolvedPath ??= (await resolveInCwd(writtenPath, ctx.cwd)).resolved;
        await valAccess(resolvedPath, writtenPath);
        const file = await loadFileKindAndText(resolvedPath, {
          maxLines: MAX_HASH_LINES,
          displayPath: writtenPath,
        });
        if (file.kind !== "text") return;
        const { normalized, fileHashes, absolutePath } = await readNormFile(
          writtenPath,
          ctx.cwd,
          { maxLines: MAX_HASH_LINES, preloadedFile: file },
        );
        const preview = await fmtReadPreview(
          normalized,
          {},
          fileHashes,
          absolutePath,
          DEFAULT_MAX_BYTES,
          DEFAULT_MAX_LINES,
        );
        const fileLines = splitLines(normalized);
        const servedMap = buildServedMap(fileHashes, fileLines, preview.servedHashes);
        await recordServedSafe(
          absolutePath,
          servedMap,
          "auto-read",
          new Set(fileHashes),
        );
        return {
          content: [
            ...(event.content ?? []),
            {
              type: "text",
              text: `\n\n--- Auto-read (hashline anchors) ---\n${preview.text}`,
            },
          ],
        };
      } catch (error) {
        console.error("Auto-read after write failed:", error);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            ...(event.content ?? []),
            { type: "text", text: `\n\n--- Auto-read failed: ${message} ---` },
          ],
        };
      }
    }

    if (
      event.toolName !== "replace" &&
      event.toolName !== "insert" &&
      event.toolName !== "undo_last_change"
    ) return;
    if (!autoRead) return;

    const metrics = (event.details as { metrics?: RMetrics } | undefined)?.metrics;
    if (metrics?.classification === "noop") return;

    const diff = (event.details as { diff?: string } | undefined)?.diff;
    if (typeof diff !== "string") return;
    const hasDiff = diff.length > 0;

    const rendered = (event.content ?? [])
      .filter(
        (entry): entry is { type: "text"; text: string } =>
          entry.type === "text" && typeof entry.text === "string",
      )
      .map((entry) => entry.text)
      .join("\n");
    const warnings = extractWarnings(rendered);
    const emptyHint = "[post-edit] applied successfully; the diff is empty (whitespace-only change).";
    const hint = hasDiff
      ? (warnings ? `${diff}\n\n${warnings}` : diff)
      : (warnings ? `${emptyHint}\n\n${warnings}` : emptyHint);
    return {
      content: [{ type: "text", text: hint }],
    };
  });
}
