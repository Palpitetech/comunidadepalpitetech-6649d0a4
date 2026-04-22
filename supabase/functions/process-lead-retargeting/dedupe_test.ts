import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DEDUPE_WINDOW_MS,
  dedupeLowerBoundIso,
  isEnqueueAllowed,
  makeSupabaseDedupeClient,
  normalizeStatuses,
  type DedupeQueueClient,
  type QueueStatus,
} from "./dedupe.ts";

const TEMPLATE_ID = "00000000-0000-0000-0000-000000000aaa";
const PHONE = "5551999990001";
const NOW = new Date("2026-04-22T12:00:00.000Z");

function fakeClient(
  countByArgs: (args: {
    templateId: string;
    phone: string;
    sinceIso: string;
    statuses?: QueueStatus[];
  }) => { count: number; error: string | null },
): DedupeQueueClient {
  return {
    countRecentForTemplatePhone(args) {
      return Promise.resolve(countByArgs(args));
    },
  };
}

Deno.test("dedupeLowerBoundIso: returns now minus 7 days exactly", () => {
  const lower = dedupeLowerBoundIso(NOW);
  const expected = new Date(NOW.getTime() - DEDUPE_WINDOW_MS).toISOString();
  assertEquals(lower, expected);
  assertEquals(DEDUPE_WINDOW_MS, 7 * 24 * 60 * 60 * 1000);
});

Deno.test("normalizeStatuses: undefined → undefined", () => {
  assertEquals(normalizeStatuses(undefined), undefined);
});

Deno.test("normalizeStatuses: empty array → undefined (no filter)", () => {
  assertEquals(normalizeStatuses([]), undefined);
});

Deno.test("normalizeStatuses: dedupes and sorts", () => {
  assertEquals(normalizeStatuses(["sent", "pending", "sent"]), [
    "pending",
    "sent",
  ]);
});

Deno.test("isEnqueueAllowed: allows when zero recent rows exist", async () => {
  const client = fakeClient(() => ({ count: 0, error: null }));
  const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
  assertEquals(res, { allowed: true, error: null });
});

Deno.test("isEnqueueAllowed: blocks when one row exists in the 7d window", async () => {
  const client = fakeClient(() => ({ count: 1, error: null }));
  const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
  assertEquals(res, { allowed: false, error: null });
});

Deno.test("isEnqueueAllowed: blocks when many rows exist", async () => {
  const client = fakeClient(() => ({ count: 7, error: null }));
  const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
  assertEquals(res.allowed, false);
});

Deno.test("isEnqueueAllowed: passes correct template_id and phone to the query", async () => {
  let captured:
    | { templateId: string; phone: string; sinceIso: string; statuses?: QueueStatus[] }
    | null = null;
  const client = fakeClient((args) => {
    captured = args;
    return { count: 0, error: null };
  });
  await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
  assertStrictEquals(captured!.templateId, TEMPLATE_ID);
  assertStrictEquals(captured!.phone, PHONE);
  assertStrictEquals(captured!.sinceIso, dedupeLowerBoundIso(NOW));
  // Default: no status filter passed downstream
  assertEquals(captured!.statuses, undefined);
});

Deno.test("isEnqueueAllowed: error from DB blocks (fail closed) and propagates message", async () => {
  const client = fakeClient(() => ({
    count: 0,
    error: "connection reset",
  }));
  const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
  assertEquals(res, { allowed: false, error: "connection reset" });
});

Deno.test(
  "isEnqueueAllowed: a row exactly 7 days old is INSIDE the window (blocks)",
  async () => {
    const sevenDaysAgoIso = new Date(NOW.getTime() - DEDUPE_WINDOW_MS)
      .toISOString();
    const rows = [{ created_at: sevenDaysAgoIso }];
    const client = fakeClient(({ sinceIso }) => {
      const count = rows.filter((r) => r.created_at >= sinceIso).length;
      return { count, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
    assertEquals(res.allowed, false);
  },
);

Deno.test(
  "isEnqueueAllowed: a row 7 days + 1ms old is OUTSIDE the window (allows)",
  async () => {
    const justOverIso = new Date(NOW.getTime() - DEDUPE_WINDOW_MS - 1)
      .toISOString();
    const rows = [{ created_at: justOverIso }];
    const client = fakeClient(({ sinceIso }) => {
      const count = rows.filter((r) => r.created_at >= sinceIso).length;
      return { count, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
    assertEquals(res.allowed, true);
  },
);

Deno.test(
  "isEnqueueAllowed: different template_id with same phone is allowed (no cross-block)",
  async () => {
    const rows = [
      {
        template_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        phone: PHONE,
        created_at: NOW.toISOString(),
      },
    ];
    const client = fakeClient(({ templateId, phone, sinceIso }) => {
      const count = rows.filter(
        (r) =>
          r.template_id === templateId &&
          r.phone === phone &&
          r.created_at >= sinceIso,
      ).length;
      return { count, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
    assertEquals(res.allowed, true);
  },
);

Deno.test(
  "isEnqueueAllowed: same template_id with different phone is allowed",
  async () => {
    const rows = [
      {
        template_id: TEMPLATE_ID,
        phone: "5551888880002",
        created_at: NOW.toISOString(),
      },
    ];
    const client = fakeClient(({ templateId, phone, sinceIso }) => {
      const count = rows.filter(
        (r) =>
          r.template_id === templateId &&
          r.phone === phone &&
          r.created_at >= sinceIso,
      ).length;
      return { count, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
    assertEquals(res.allowed, true);
  },
);

Deno.test(
  "isEnqueueAllowed (default): counts rows of any status (pending, sent, failed) within window",
  async () => {
    const rows = [
      {
        status: "sent",
        created_at: new Date(NOW.getTime() - 3 * 24 * 60 * 60_000).toISOString(),
      },
      {
        status: "failed",
        created_at: new Date(NOW.getTime() - 1 * 24 * 60 * 60_000).toISOString(),
      },
    ];
    const client = fakeClient(({ sinceIso, statuses }) => {
      const filtered = rows.filter((r) => r.created_at >= sinceIso);
      const final = statuses
        ? filtered.filter((r) => statuses.includes(r.status as QueueStatus))
        : filtered;
      return { count: final.length, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
    assertEquals(res.allowed, false);
  },
);

// =========================================================================
// Optional status filter — new behavior
// =========================================================================

Deno.test(
  "isEnqueueAllowed (status filter): only 'failed' rows + filter=['sent'] → allows",
  async () => {
    const rows = [
      {
        status: "failed",
        created_at: new Date(NOW.getTime() - 2 * 24 * 60 * 60_000).toISOString(),
      },
      {
        status: "failed",
        created_at: new Date(NOW.getTime() - 4 * 24 * 60 * 60_000).toISOString(),
      },
    ];
    const client = fakeClient(({ sinceIso, statuses }) => {
      const filtered = rows.filter((r) => r.created_at >= sinceIso);
      const final = statuses
        ? filtered.filter((r) => statuses.includes(r.status as QueueStatus))
        : filtered;
      return { count: final.length, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW, {
      statuses: ["sent"],
    });
    assertEquals(res, { allowed: true, error: null });
  },
);

Deno.test(
  "isEnqueueAllowed (status filter): mix of 'sent' and 'failed' + filter=['sent'] → blocks",
  async () => {
    const rows = [
      {
        status: "sent",
        created_at: new Date(NOW.getTime() - 1 * 24 * 60 * 60_000).toISOString(),
      },
      {
        status: "failed",
        created_at: new Date(NOW.getTime() - 2 * 24 * 60 * 60_000).toISOString(),
      },
    ];
    const client = fakeClient(({ sinceIso, statuses }) => {
      const filtered = rows.filter((r) => r.created_at >= sinceIso);
      const final = statuses
        ? filtered.filter((r) => statuses.includes(r.status as QueueStatus))
        : filtered;
      return { count: final.length, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW, {
      statuses: ["sent"],
    });
    assertEquals(res.allowed, false);
  },
);

Deno.test(
  "isEnqueueAllowed (status filter): filter=['pending','sent'] ignores 'failed'",
  async () => {
    const rows = [
      {
        status: "failed",
        created_at: new Date(NOW.getTime() - 1 * 24 * 60 * 60_000).toISOString(),
      },
    ];
    const client = fakeClient(({ sinceIso, statuses }) => {
      const filtered = rows.filter((r) => r.created_at >= sinceIso);
      const final = statuses
        ? filtered.filter((r) => statuses.includes(r.status as QueueStatus))
        : filtered;
      return { count: final.length, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW, {
      statuses: ["pending", "sent"],
    });
    assertEquals(res.allowed, true);
  },
);

Deno.test(
  "isEnqueueAllowed (status filter): empty array behaves as no filter",
  async () => {
    let captured: QueueStatus[] | undefined = ["sent"];
    const client = fakeClient(({ statuses }) => {
      captured = statuses;
      return { count: 0, error: null };
    });
    await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW, { statuses: [] });
    assertEquals(captured, undefined);
  },
);

Deno.test(
  "isEnqueueAllowed (status filter): duplicates in input are normalized",
  async () => {
    let captured: QueueStatus[] | undefined;
    const client = fakeClient(({ statuses }) => {
      captured = statuses;
      return { count: 0, error: null };
    });
    await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW, {
      statuses: ["sent", "pending", "sent", "pending"],
    });
    assertEquals(captured, ["pending", "sent"]);
  },
);

// =========================================================================
// Supabase adapter
// =========================================================================

Deno.test(
  "makeSupabaseDedupeClient: builds the correct chain on a fake supabase (no status filter)",
  async () => {
    const calls: string[] = [];
    let capturedTable = "";
    let capturedTemplateEq: [string, string] | null = null;
    let capturedPhoneEq: [string, string] | null = null;
    let capturedGte: [string, string] | null = null;
    let inCalled = false;

    const fakeSupabase = {
      from(table: string) {
        capturedTable = table;
        calls.push("from");
        return {
          select(cols: string, opts: { count: "exact"; head: true }) {
            calls.push(`select:${cols}:${opts.count}:${opts.head}`);
            const builder = {
              eq(col1: string, val1: string) {
                capturedTemplateEq = [col1, val1];
                calls.push(`eq1:${col1}`);
                return {
                  eq(col2: string, val2: string) {
                    capturedPhoneEq = [col2, val2];
                    calls.push(`eq2:${col2}`);
                    return {
                      in(_col: string, _vals: string[]) {
                        inCalled = true;
                        return this;
                      },
                      gte(col3: string, val3: string) {
                        capturedGte = [col3, val3];
                        calls.push(`gte:${col3}`);
                        return Promise.resolve({ count: 0, error: null });
                      },
                    };
                  },
                };
              },
            };
            return builder as never;
          },
        };
      },
    };

    const client = makeSupabaseDedupeClient(fakeSupabase as never);
    const sinceIso = dedupeLowerBoundIso(NOW);
    const res = await client.countRecentForTemplatePhone({
      templateId: TEMPLATE_ID,
      phone: PHONE,
      sinceIso,
    });

    assertEquals(res, { count: 0, error: null });
    assertEquals(capturedTable, "message_queue");
    assertEquals(capturedTemplateEq, ["template_id", TEMPLATE_ID]);
    assertEquals(capturedPhoneEq, ["recipient_phone", PHONE]);
    assertEquals(capturedGte, ["created_at", sinceIso]);
    assertEquals(inCalled, false);
    assertEquals(calls, [
      "from",
      "select:id:exact:true",
      "eq1:template_id",
      "eq2:recipient_phone",
      "gte:created_at",
    ]);
  },
);

Deno.test(
  "makeSupabaseDedupeClient: applies .in('status', statuses) when filter is provided",
  async () => {
    let capturedInCol = "";
    let capturedInVals: string[] = [];
    let inCalled = false;

    const fakeSupabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      in(col: string, vals: string[]) {
                        inCalled = true;
                        capturedInCol = col;
                        capturedInVals = vals;
                        return {
                          gte() {
                            return Promise.resolve({ count: 0, error: null });
                          },
                        };
                      },
                      gte() {
                        return Promise.resolve({ count: 0, error: null });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    };

    const client = makeSupabaseDedupeClient(fakeSupabase as never);
    await client.countRecentForTemplatePhone({
      templateId: TEMPLATE_ID,
      phone: PHONE,
      sinceIso: dedupeLowerBoundIso(NOW),
      statuses: ["pending", "sent"],
    });

    assertEquals(inCalled, true);
    assertEquals(capturedInCol, "status");
    assertEquals(capturedInVals, ["pending", "sent"]);
  },
);

Deno.test(
  "makeSupabaseDedupeClient: surfaces supabase error.message as string",
  async () => {
    const fakeSupabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      gte() {
                        return Promise.resolve({
                          count: null,
                          error: { message: "boom" },
                        });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    };
    const client = makeSupabaseDedupeClient(fakeSupabase as never);
    const res = await client.countRecentForTemplatePhone({
      templateId: TEMPLATE_ID,
      phone: PHONE,
      sinceIso: dedupeLowerBoundIso(NOW),
    });
    assertEquals(res, { count: 0, error: "boom" });
  },
);

// =========================================================================
// dedupeLowerBoundIso — boundary precision & timezone consistency
// =========================================================================

Deno.test("dedupeLowerBoundIso: 0ms precision (now exact whole second) → exact 7-day shift", () => {
  const exactSecond = new Date("2026-04-22T12:00:00.000Z");
  const result = dedupeLowerBoundIso(exactSecond);
  assertEquals(result, "2026-04-15T12:00:00.000Z");
});

Deno.test("dedupeLowerBoundIso: 1ms precision is preserved in subtraction", () => {
  const oneMs = new Date("2026-04-22T12:00:00.001Z");
  const result = dedupeLowerBoundIso(oneMs);
  assertEquals(result, "2026-04-15T12:00:00.001Z");
});

Deno.test("dedupeLowerBoundIso: 500ms precision is preserved in subtraction", () => {
  const halfSecond = new Date("2026-04-22T12:00:00.500Z");
  const result = dedupeLowerBoundIso(halfSecond);
  assertEquals(result, "2026-04-15T12:00:00.500Z");
});

Deno.test("dedupeLowerBoundIso: 999ms precision is preserved in subtraction", () => {
  const almostSecond = new Date("2026-04-22T12:00:00.999Z");
  const result = dedupeLowerBoundIso(almostSecond);
  assertEquals(result, "2026-04-15T12:00:00.999Z");
});

Deno.test("dedupeLowerBoundIso: always returns a Z-suffixed UTC ISO string", () => {
  const dates = [
    new Date("2026-04-22T12:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-12-31T23:59:59.999Z"),
  ];
  for (const d of dates) {
    const result = dedupeLowerBoundIso(d);
    assertEquals(result.endsWith("Z"), true, `Expected Z suffix on ${result}`);
    assertEquals(
      result,
      new Date(result).toISOString(),
      `Result must roundtrip through Date: ${result}`,
    );
  }
});

Deno.test(
  "dedupeLowerBoundIso: same instant produces same lower bound regardless of input timezone offset",
  () => {
    // Same UTC instant expressed with different TZ offsets in the literal.
    // The Date object stores the absolute instant — the source TZ should not affect the result.
    const utc = new Date("2026-04-22T12:00:00.000Z");
    const sameInstantInBrt = new Date("2026-04-22T09:00:00.000-03:00");
    const sameInstantInJst = new Date("2026-04-22T21:00:00.000+09:00");

    // Sanity check: all three are the same absolute instant
    assertEquals(utc.getTime(), sameInstantInBrt.getTime());
    assertEquals(utc.getTime(), sameInstantInJst.getTime());

    const a = dedupeLowerBoundIso(utc);
    const b = dedupeLowerBoundIso(sameInstantInBrt);
    const c = dedupeLowerBoundIso(sameInstantInJst);

    assertEquals(a, b);
    assertEquals(b, c);
    assertEquals(a, "2026-04-15T12:00:00.000Z");
  },
);

Deno.test(
  "dedupeLowerBoundIso: handles DST-spring-forward instant (US/Brazil) without drift",
  () => {
    // Pick an instant that crosses DST in some zones — in UTC it is just an instant.
    // The function works in pure UTC, so DST cannot affect output.
    const dstSpringInstant = new Date("2026-03-08T07:00:00.000Z"); // 2am→3am EST→EDT
    const result = dedupeLowerBoundIso(dstSpringInstant);
    assertEquals(result, "2026-03-01T07:00:00.000Z");
  },
);

Deno.test(
  "dedupeLowerBoundIso: handles year/month/leap-day boundary correctly",
  () => {
    // 7 days before March 5, 2028 lands on Feb 27 — and 2028 IS a leap year (Feb 29 exists).
    const afterLeap = new Date("2028-03-05T10:30:00.000Z");
    const result = dedupeLowerBoundIso(afterLeap);
    assertEquals(result, "2028-02-27T10:30:00.000Z");
  },
);

Deno.test(
  "dedupeLowerBoundIso: window length is exactly DEDUPE_WINDOW_MS milliseconds",
  () => {
    const now = new Date("2026-04-22T12:34:56.789Z");
    const lower = dedupeLowerBoundIso(now);
    const diff = now.getTime() - new Date(lower).getTime();
    assertEquals(diff, DEDUPE_WINDOW_MS);
    assertEquals(diff, 604_800_000); // 7 * 24 * 60 * 60 * 1000
  },
);
