// Tells Central which permissions this application's code understands, so roles in Central can only use these.
//   npm run permissions:sync [-- --confirm-removals --retries 5 --wait 20]
//   npm run permissions:check [-- --allow-removals]   (changes nothing, exits 1 on a mismatch)
//   --soft: a failure is only a warning and the exit code stays 0, for "predev" so a Central that is off does not stop dev.
// It runs by hand, from "predev" and in the deploy workflow, with the same .env names the rest of the app reads.
require("dotenv").config();
const axios = require("axios");
const { centralHeaders } = require("../utils/centralHeaders");
const {
  PERMISSION_VALUES,
  PERMISSION_DETAILS,
} = require("../constants/permissions");

// What each permission is for, shown to whoever builds roles in Central.
const DESCRIPTIONS = Object.fromEntries(
  Object.entries(PERMISSION_DETAILS).map(([key, detail]) => [
    key,
    detail.description,
  ]),
);

const humanize = (key) => {
  const text = key.replace(/[._]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// The permissions of the code, as Central takes them.
function buildManifest(values = PERMISSION_VALUES) {
  return values.map((key) => {
    const requires = PERMISSION_DETAILS[key]?.requires;
    return {
      key,
      description: DESCRIPTIONS[key] || humanize(key),
      ...(requires ? { requires } : {}),
    };
  });
}

// Same names as the data center client. The names Central writes in its block come first, the old ones only when those are empty.
function connection(env = process.env) {
  const base = env.CENTRAL_API_BASE_URL || env.MWS_DATA_CENTER_API_URL;
  const token = env.CENTRAL_API_TOKEN || env.MWS_DATA_CENTER_API_TOKEN;
  if (!base || !token) {
    throw new Error("CENTRAL_API_BASE_URL and CENTRAL_API_TOKEN must be set");
  }
  return {
    url: `${base.replace(/\/+$/, "")}/application-permissions/me`,
    token,
  };
}

function flagNumber(flags, name, fallback) {
  const index = flags.indexOf(name);
  const value = index >= 0 ? Number(flags[index + 1]) : NaN;
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

const sleep = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

// Central may be starting while a deploy runs, so a missing answer is asked again. A no from Central is final.
async function withRetries(call, { retries, wait }) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      const unreachable =
        !error.response ||
        error.response.status >= 500 ||
        error.response.status === 429;
      if (!unreachable || attempt >= retries) throw error;
      console.warn(
        `attempt ${attempt + 1} failed (${error.message}), asking again in ${wait}s`,
      );
      await sleep(wait);
    }
  }
}

function explain(error) {
  const data = error.response?.data;
  const answer = data?.errors || data?.message;
  if (!error.response) return error.message;
  // Central's own refusals carry a message. Anything else (a wrong address, a proxy) is shown with where the call went.
  const text = typeof answer === "string" ? answer : answer ? JSON.stringify(answer) : "";
  const where = `${(error.config?.method || "").toUpperCase()} ${error.config?.url || ""}`.trim();
  const page = !text && typeof data === "string" ? ` ${data.replace(/\s+/g, " ").slice(0, 120)}` : "";
  return `Central said ${error.response.status}${text ? `: ${text}` : ""} (${where})${page}`;
}

async function sync(flags) {
  const { url, token } = connection();
  const body = {
    permissions: buildManifest(),
    confirm_removals: flags.includes("--confirm-removals") || undefined,
  };
  const { data } = await withRetries(
    () =>
      axios.put(url, body, {
        headers: centralHeaders(token),
        timeout: 10000,
      }),
    {
      retries: flagNumber(flags, "--retries", 0),
      wait: flagNumber(flags, "--wait", 20),
    },
  );
  const result = data.data || {};
  console.log(
    `permissions published: ${result.total ?? body.permissions.length} total, ${result.added ?? 0} new`,
  );
  if ((result.deprecated || []).length > 0)
    console.warn(`dropped from the list: ${result.deprecated.join(", ")}`);
  for (const role of result.affected_roles || []) {
    console.warn(
      `role ${role.role} still carries a dropped permission: ${(role.permissions || []).join(", ")}`,
    );
  }
}

async function check(flags) {
  const { url, token } = connection();
  const { data } = await withRetries(
    () =>
      axios.get(url, {
        headers: centralHeaders(token),
        timeout: 10000,
      }),
    {
      retries: flagNumber(flags, "--retries", 0),
      wait: flagNumber(flags, "--wait", 20),
    },
  );
  const registered = (data.data || [])
    .filter((row) => !row.deprecated)
    .map((row) => row.key);
  const inCode = new Set(PERMISSION_VALUES);
  const notRegistered = PERMISSION_VALUES.filter(
    (key) => !registered.includes(key),
  );
  const wouldDrop = registered.filter((key) => !inCode.has(key));
  // Not registered yet is expected before a deploy. Registered but gone from the code is what to look at.
  if (notRegistered.length > 0)
    console.warn(
      `not registered in Central yet (a sync adds them): ${notRegistered.join(", ")}`,
    );
  if (wouldDrop.length > 0)
    console.warn(
      `registered but gone from the code (a sync drops them): ${wouldDrop.join(", ")}`,
    );
  if (wouldDrop.length > 0 && !flags.includes("--allow-removals")) {
    console.error("permissions do not match Central");
    process.exit(1);
  }
  console.log("permissions match Central");
}

async function main() {
  const flags = process.argv.slice(2);
  try {
    if (flags.includes("--check")) await check(flags);
    else await sync(flags);
  } catch (error) {
    if (flags.includes("--soft")) {
      console.warn(`permissions not sent, continuing: ${explain(error)}`);
      return;
    }
    console.error(explain(error));
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  buildManifest,
  connection,
  flagNumber,
  withRetries,
  explain,
  DESCRIPTIONS,
};
