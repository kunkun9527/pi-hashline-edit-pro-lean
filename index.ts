// pi-hashline-edit-pro-lean: full hashline logic from pi-hashline-edit-pro,
// with trimmed tool descriptions (~200 tok/req vs ~1200 upstream).
// No prompts/skills resources shipped; session hooks copied from upstream index.ts.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DEFAULT_MAX_BYTES } from "@earendil-works/pi-coding-agent";
import { initHasher } from "pi-hashline-edit-pro/src/hashline";
import { regReplace } from "pi-hashline-edit-pro/src/replace";
import { regReplaceUndo, clearUndo } from "pi-hashline-edit-pro/src/replace-undo";
import { regRead, fmtReadPreview } from "pi-hashline-edit-pro/src/read";
import type { RMetrics } from "pi-hashline-edit-pro/src/replace-response";
import { extractWarnings } from "pi-hashline-edit-pro/src/replace-render";
import { MAX_HASH_LINES } from "pi-hashline-edit-pro/src/hashline";
import { AUTO_READ_MAX } from "pi-hashline-edit-pro/src/constants";
import { readConfig, toggleAutoRead } from "pi-hashline-edit-pro/src/config";
import { loadHashStore, pruneMissing } from "pi-hashline-edit-pro/src/hash-store";
import { recordServed, clearServed } from "pi-hashline-edit-pro/src/served";
import { readNormFile } from "pi-hashline-edit-pro/src/file-reader";
import { loadFileKindAndText } from "pi-hashline-edit-pro/src/file-kind";
import { toCwd } from "pi-hashline-edit-pro/src/paths";
import { resolveTarget } from "pi-hashline-edit-pro/src/fs-write";
import { valAccess } from "pi-hashline-edit-pro/src/validation";

// ---- trimmed tool text (keeps core usage rules, drops verbosity) ----

const DESC: Record<string, string> = {
  read: "Read a file with 3-char HASH anchors for line-safe replacement; supports paging and images.",
  replace: "Replace an inclusive line range using 3-char HASH anchors from read output.",
  undo_last_replace: "Undo the most recent replace for a file.",
};

const GUIDE: Record<string, string> = {
  read: "Copy HASH from read's left column; never invent hashes. Re-read after file changes.",
  replace: "- remove_from/remove_to are bare 3-char hashes from read's left column; first/last removed, inclusive. Never include content or invent hashes.\n- replacement_text replaces the whole range: reproduce unchanged lines and indentation. \\n separates lines; trailing \\n adds a blank line; \"\" deletes. For one line, use the same hash twice.\n- Keep ranges tight. [E_RANGE_STALE] means nothing changed: re-read and retry. Make one replace per message and verify its diff before the next.",
  undo_last_replace: "Only the latest replace can be undone; write clears history. Undo immediately if the diff removed wanted lines.",
};

// Parameter names plus the usage guide carry the semantics; field prose would duplicate them.
const PARAMS: Record<string, Record<string, string>> = {
  read: {},
  replace: {},
  undo_last_replace: {},
};

type AnyTool = {
  name: string;
  description?: string;
  promptSnippet?: string;
  promptGuidelines?: string | string[];
  parameters?: { properties?: Record<string, { description?: string }> };
  [k: string]: unknown;
};

// pi core iterates promptGuidelines (for-of) — must be an ARRAY of lines, never a string
function toGuidelineLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function trimTool(tool: AnyTool): AnyTool {
  const out: AnyTool = { ...tool };
  const name = out.name ?? "";
  if (DESC[name]) out.description = DESC[name];
  delete out.promptSnippet;
  if (GUIDE[name]) out.promptGuidelines = toGuidelineLines(GUIDE[name]);
  const props = out.parameters?.properties;
  if (props && PARAMS[name]) {
    const newProps: Record<string, { description?: string }> = {};
    for (const [k, v] of Object.entries(props)) {
      const next = { ...v };
      delete next.description;
      const description = PARAMS[name][k];
      if (description) next.description = description;
      newProps[k] = next;
    }
    out.parameters = { ...out.parameters, properties: newProps };
  }
  return out;
}

function leanPi(pi: ExtensionAPI): ExtensionAPI {
  return new Proxy(pi, {
    get(target, prop, receiver) {
      if (prop === "registerTool") {
        return (tool: AnyTool) => target.registerTool(trimTool(tool) as never);
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// ---- session hooks (copied verbatim from upstream index.ts) ----

export default function (pi: ExtensionAPI): void {
  const lpi = leanPi(pi);

  regRead(lpi);
  regReplace(lpi);
  regReplaceUndo(lpi);

  let autoRead = true;

  pi.on("session_start", async (_event, ctx) => {
    const active = pi.getActiveTools();
    pi.setActiveTools(active.filter((t) => t !== "edit"));
    await initHasher();
    try {
      const store = await loadHashStore();
      await pruneMissing(store);
    } catch (err) {
      console.error("Failed to load or prune hash store:", err);
    }
    const config = await readConfig();
    autoRead = config.autoRead;
    const debugValue = process.env.PI_HASHLINE_DEBUG;
    if (debugValue === "1" || debugValue === "true") {
      ctx.ui.notify(`Hashline Edit mode active`, "info");
    }
  });

  pi.registerCommand("toggle-auto-read", {
    description: "Toggle automatic hashline anchors after write and post-edit diffs after replace and undo_last_replace operations",
    handler: async (_args, ctx) => {
      autoRead = await toggleAutoRead();
      const state = autoRead ? "enabled" : "disabled";
      ctx.ui.notify(`Auto-read anchors (write) and post-edit diffs (replace/undo): ${state}`, "info");
    },
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.isError) return;

    if (event.toolName === "write") {
      const writtenPath = (event.input as Record<string, unknown>)?.path;
      if (typeof writtenPath === "string") {
        try {
          const target = await resolveTarget(toCwd(writtenPath, ctx.cwd));
          await clearUndo(target);
          const store = await loadHashStore();
          clearServed(store, target);
        } catch (error) {
          console.error("Failed to clear undo after write:", error);
        }
      }
      if (!autoRead) return;
      if (typeof writtenPath !== "string") return;
      try {
        const resolvedPath = await resolveTarget(toCwd(writtenPath, ctx.cwd));
        await valAccess(resolvedPath, writtenPath);
        const file = await loadFileKindAndText(resolvedPath, { maxLines: MAX_HASH_LINES, displayPath: writtenPath });
        if (file.kind !== "text") return;
        const { normalized, fileHashes, absolutePath } = await readNormFile(
          writtenPath, ctx.cwd, { maxLines: MAX_HASH_LINES, preloadedFile: file },
        );
        const preview = await fmtReadPreview(
          normalized,
          {},
          fileHashes,
          absolutePath,
          DEFAULT_MAX_BYTES,
          AUTO_READ_MAX,
        );
        try {
          const store = await loadHashStore();
          recordServed(store, absolutePath, preview.servedHashes);
        } catch (error) {
          console.error("Failed to record served state from auto-read:", error);
        }
        return {
          content: [
            ...(event.content ?? []),
            { type: "text", text: `\n\n--- Auto-read (hashline anchors) ---\n${preview.text}` },
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
      event.toolName !== "undo_last_replace"
    ) return;
    if (!autoRead) return;

    const metrics = (event.details as { metrics?: RMetrics } | undefined)?.metrics;
    if (metrics?.classification === "noop") return;

    const diff = (event.details as { diff?: string } | undefined)?.diff;
    if (!diff) return;

    const rendered = (event.content ?? [])
      .filter(
        (entry): entry is { type: "text"; text: string } =>
          entry.type === "text" && typeof entry.text === "string",
      )
      .map((entry) => entry.text)
      .join("\n");
    const warnings = extractWarnings(rendered);
    return {
      content: [
        {
          type: "text",
          text: warnings ? `${diff}\n\n${warnings}` : diff,
        },
      ],
    };
  });
}
