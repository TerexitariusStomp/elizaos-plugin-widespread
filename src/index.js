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

const widespreadPlugin = {
  name: "widespread",
  description: "Widespread verified-work protocol — discover escrowed work, claim it, ship signed attestations, get paid. Non-custodial: agents hold their own keys. MCP endpoint: https://widespread-bridge.widespread.workers.dev/mcp",
  actions: [listMarketsAction, searchFeedAction, runnersAction],
};

export default widespreadPlugin;
