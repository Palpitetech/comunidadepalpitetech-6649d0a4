import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DEDUPE_WINDOW_MS,
  dedupeLowerBoundIso,
  isEnqueueAllowed,
  makeSupabaseDedupeClient,
  type DedupeQueueClient,
} from "./dedupe.ts";

const TEMPLATE_ID = "00000000-0000-0000-0000-000000000aaa";
const PHONE = "5551999990001";
const NOW = new Date("2026-04-22T12:00:00.000Z");

function fakeClient(
  countByArgs: (args: {
    templateId: string;
    phone: string;
    sinceIso: string;
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
  let captured: { templateId: string; phone: string; sinceIso: string } | null =
    null;
  const client = fakeClient((args) => {
    captured = args;
    return { count: 0, error: null };
  });
  await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
  assertStrictEquals(captured!.templateId, TEMPLATE_ID);
  assertStrictEquals(captured!.phone, PHONE);
  assertStrictEquals(captured!.sinceIso, dedupeLowerBoundIso(NOW));
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
    // Simulate the supabase chain: the .gte filter with sinceIso=now-7d
    // would return rows where created_at >= sinceIso, so an exact-7d row
    // matches and count=1 → blocked.
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
    // Simulate DB containing a row for a different template
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
  "isEnqueueAllowed: counts rows of any status (pending, sent, failed) within window",
  async () => {
    // The dedupe query intentionally does NOT filter by status, so a 'sent'
    // or 'failed' row from 3 days ago must still block re-enqueue.
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
    const client = fakeClient(({ sinceIso }) => {
      const count = rows.filter((r) => r.created_at >= sinceIso).length;
      return { count, error: null };
    });
    const res = await isEnqueueAllowed(client, TEMPLATE_ID, PHONE, NOW);
    assertEquals(res.allowed, false);
  },
);

Deno.test(
  "makeSupabaseDedupeClient: builds the correct chain on a fake supabase",
  async () => {
    const calls: string[] = [];
    let capturedTable = "";
    let capturedTemplateEq: [string, string] | null = null;
    let capturedPhoneEq: [string, string] | null = null;
    let capturedGte: [string, string] | null = null;

    const fakeSupabase = {
      from(table: string) {
        capturedTable = table;
        calls.push("from");
        return {
          select(cols: string, opts: { count: "exact"; head: true }) {
            calls.push(`select:${cols}:${opts.count}:${opts.head}`);
            return {
              eq(col1: string, val1: string) {
                capturedTemplateEq = [col1, val1];
                calls.push(`eq1:${col1}`);
                return {
                  eq(col2: string, val2: string) {
                    capturedPhoneEq = [col2, val2];
                    calls.push(`eq2:${col2}`);
                    return {
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
          },
        };
      },
    };

    const client = makeSupabaseDedupeClient(fakeSupabase);
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
    const client = makeSupabaseDedupeClient(fakeSupabase);
    const res = await client.countRecentForTemplatePhone({
      templateId: TEMPLATE_ID,
      phone: PHONE,
      sinceIso: dedupeLowerBoundIso(NOW),
    });
    assertEquals(res, { count: 0, error: "boom" });
  },
);
