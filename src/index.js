/** @elizaos plugin: widespread — verified-work protocol (read/discovery surface). */

const BASE = "https://widespread-bridge.widespread.workers.dev";

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`widespread ${path}: HTTP ${r.status}`);
  return r.json();
}
const respond = (callback, data) => callback?.({ text: JSON.stringify(data, null, 1), content: data }) ?? data;

const listMarketsAction = {
  name: "WIDE_MARKETS",
  similes: ["LIST_BOUNTIES", "WIDE_BOUNTIES", "OPEN_WORK"],
  description: "List open escrowed work markets and fiat-mirror bounties on Widespread — funded work any agent can claim.",
  validate: async () => true,
  handler: async (_rt, _msg, _st, _opts, callback) => {
    const [markets, bounties] = await Promise.all([get("/api/markets"), get("/api/feed")]);
    return respond(callback, { markets, bounties });
  },
  examples: [[
    { user: "{{user1}}", content: { text: "what funded work is open on widespread?" } },
    { user: "{{agent}}", content: { text: "Checking open markets…", action: "WIDE_MARKETS" } },
  ]],
};

const searchFeedAction = {
  name: "WIDE_FEED",
  similes: ["SEARCH_BOUNTIES", "FIND_WORK", "FEED_SEARCH"],
  description: "Search the unified cross-forge funded-work feed (GitHub, GitLab, Forgejo, NEAR, bounty platforms) by keyword, forge, source, or minimum reward.",
  validate: async () => true,
  handler: async (_rt, message, _st, _opts, callback) => {
    const q = new URLSearchParams();
    const text = message?.content?.text ?? "";
    const m = text.match(/over \$?(\d+)/i);
    if (m) q.set("min_usd", m[1]);
    const forge = text.match(/\b(github|gitlab|forgejo|near|radicle|tangled)\b/i);
    if (forge) q.set("forge", forge[1].toLowerCase());
    return respond(callback, await get(`/api/feed?${q}`));
  },
  examples: [[
    { user: "{{user1}}", content: { text: "find github bounties over $50" } },
    { user: "{{agent}}", content: { text: "Searching the work feed…", action: "WIDE_FEED" } },
  ]],
};

const runnersAction = {
  name: "WIDE_RUNNERS",
  similes: ["EXECUTION_ENVIRONMENTS", "SANDBOXES"],
  description: "List sealed client-side execution environments for running bounty work safely (browser sandbox, self-hosted sealed runners).",
  validate: async () => true,
  handler: async (_rt, _m, _s, _o, callback) => respond(callback, await get("/api/runners")),
  examples: [[
    { user: "{{user1}}", content: { text: "where can I run widespread work safely?" } },
    { user: "{{agent}}", content: { text: "Listing sealed runners…", action: "WIDE_RUNNERS" } },
  ]],
};

const declareAction = {
  name: "WIDE_DECLARE",
  similes: ["POST_BOUNTY", "CREATE_BOUNTY", "FUND_WORK"],
  description: "Post a task on Widespread: declare a bounty for ANY work domain (code, social-media, writing, research, data). Returns canonical declaration text + zero-auth intent URLs for every platform — one escrow, N surfaces, one payout.",
  validate: async () => true,
  handler: async (_rt, message, _st, _opts, callback) => {
    const text = message?.content?.text ?? "";
    const amount = (text.match(/\$?([\d.]+)\s*(USD|NEAR|EUR|PYUSD)?/i) ?? [])[1] ?? "0";
    const currency = (text.match(/\b(NEAR|EUR|PYUSD)\b/i) ?? [])[1] ?? "USD";
    const domain = (text.match(/\b(social[- ]?media|code|writing|research|data|design)\b/i) ?? [])[1]?.toLowerCase().replace(" ", "-") ?? "other";
    const spec = text.replace(/declare|bounty|post|fund|widespread|\$?[\d.]+\s*(USD|NEAR|EUR|PYUSD)?/gi, " ").replace(/\s+/g, " ").trim() || text;
    const r = await fetch(`${BASE}/api/bounty/broadcast`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain, spec, amount, currency }),
    });
    return respond(callback, await r.json().catch(() => ({ error: "declare failed" })));
  },
  examples: [[
    { user: "{{user1}}", content: { text: "declare a $50 social-media bounty to ghostwrite a linkedin post" } },
    { user: "{{agent}}", content: { text: "Declaring the bounty…", action: "WIDE_DECLARE" } },
  ]],
};

const widespreadPlugin = {
  name: "widespread",
  description: "Widespread verified-work protocol — discover escrowed work, claim it, ship signed attestations, get paid. Non-custodial: agents hold their own keys. MCP endpoint: https://widespread-bridge.widespread.workers.dev/mcp",
  actions: [listMarketsAction, searchFeedAction, runnersAction, declareAction],
};

export default widespreadPlugin;
