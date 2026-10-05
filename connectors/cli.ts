// npm run fetch -- [--source alamo] [--out .data] [--window 14] [--raw-dir raw] [--dry-run]
import { parseArgs } from "node:util";
import { alamo } from "./alamo";
import { runConnectors } from "./run";
import { JsonFileSink } from "./sinks/json-file";
import theaters from "./theaters.json";
import type { Connector, TheaterRef } from "./types";

const connectors: Connector[] = [alamo];

async function main() {
  const { values } = parseArgs({
    options: {
      source: { type: "string" },
      out: { type: "string", default: ".data" },
      window: { type: "string", default: "14" },
      "raw-dir": { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });

  const selected = values.source
    ? connectors.filter((c) => c.source === values.source)
    : connectors;
  if (selected.length === 0) {
    console.error(
      `Unknown source "${values.source}". Known: ${connectors.map((c) => c.source).join(", ")}`,
    );
    return 2;
  }

  const summaries = await runConnectors(selected, theaters as TheaterRef[], {
    sink: new JsonFileSink(values.out),
    now: new Date(),
    windowDays: Number(values.window),
    dryRun: values["dry-run"],
    delayMs: 1000,
    retries: 2,
    rawDir: values["raw-dir"],
    log: console.log,
  });

  // Partial runs still wrote what they could; only a source with no data fails the job.
  for (const s of summaries.filter((s) => s.status === "partial")) {
    console.log(`::warning::${s.source} partial: ${s.errors.join("; ")}`);
  }
  const failed = summaries.filter((s) => s.status === "failed");
  if (failed.length > 0) {
    console.error(`::error::${failed.map((s) => s.source).join(", ")} failed`);
    return 1;
  }
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
