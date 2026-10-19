const axios = require("axios");
const { centralHeaders } = require("../utils/centralHeaders");
const { APP_ID } = require("../utils/centralEntitlement");

function buildCentralLookupError(message) {
  const error = new Error(message);
  error.isCentralLookupError = true;
  return error;
}

function getCentralClient() {
  // The names Central writes in its block come first. The older MWS_DATA_CENTER_API_* names are read only when
  // those are empty, so an old value in an environment can no longer hide a new token.
  const baseUrl =
    process.env.CENTRAL_API_BASE_URL || process.env.MWS_DATA_CENTER_API_URL;
  const apiToken =
    process.env.CENTRAL_API_TOKEN || process.env.MWS_DATA_CENTER_API_TOKEN;

  if (!baseUrl) {
    throw buildCentralLookupError(
      "MWS_DATA_CENTER_API_URL/CENTRAL_API_BASE_URL is not configured",
    );
  }

  try {
    const parsedUrl = new URL(baseUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("URL must use http or https");
    }
  } catch (error) {
    throw buildCentralLookupError(
      `MWS_DATA_CENTER_API_URL/CENTRAL_API_BASE_URL is invalid: ${error.message}`,
    );
  }

  if (!apiToken) {
    throw buildCentralLookupError(
      "MWS_DATA_CENTER_API_TOKEN/CENTRAL_API_TOKEN is not configured",
    );
  }

  return axios.create({
    baseURL: baseUrl.replace(/\/+$/, ""),
    headers: centralHeaders(apiToken),
    timeout: 5000,
  });
}

async function lookupEmployeeByEmail(email) {
  try {
    const { data } = await getCentralClient().get("/employees/lookup", {
      params: { email },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function lookupEmployeeByPersonId(personId) {
  try {
    const { data } = await getCentralClient().get("/employees/lookup", {
      params: { person_id: personId },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) return null;
    throw error;
  }
}

async function lookupStudentByEmail(email) {
  try {
    const { data } = await getCentralClient().get("/students/lookup", {
      params: { email },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

// Central paginates at 100/page max (StudentApiValidation.LIST) and defaults
// to status=ACTIVE server-side if status is omitted - always pass one
// explicitly rather than relying on that default, since a caller comparing
// across every lifecycle state (see dryRunCentralStudentSync.js) needs to
// choose the status itself, not silently get only ACTIVE.
async function listStudentsByStatus(status) {
  const client = getCentralClient();
  const students = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/students", {
      params: { page, size: 100, status },
    });
    students.push(...data.data);
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return students;
}

// Central paginates at 100/page max (EmployeeApiValidation.LIST) and
// defaults to status=ACTIVE server-side, the same posture as
// lookupEmployeeByEmail - this is deliberately the one status a roster
// safety-net sync cares about (see jobs/employeeDeactivationSync.js): a
// bulk diff against "who's active right now" instead of one Central call
// per locally-known user.
async function listActiveEmployees() {
  const client = getCentralClient();
  const employees = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/employees", {
      params: { page, size: 100 },
    });
    employees.push(...data.data);
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return employees;
}

// Central paginates at 100/page max (ClassTeacherAssignmentApiValidation.LIST)
// and only ever returns currently-active assignments in the currently-active
// academic year - same bulk-diff posture as listActiveEmployees().
async function listClassTeacherAssignments() {
  const client = getCentralClient();
  const assignments = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/class-teacher-assignments", {
      params: { page, size: 100 },
    });
    assignments.push(...data.data);
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return assignments;
}

// Same bulk-diff posture as listClassTeacherAssignments() - only currently
// active StudentSupportAssignment rows (end_date null), paginated at
// 100/page max.
async function listStudentSupportAssignments() {
  const client = getCentralClient();
  const assignments = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/student-support-assignments", {
      params: { page, size: 100 },
    });
    assignments.push(...data.data);
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return assignments;
}

const ENTITLEMENT_PAGE_SIZE = 100;

// What Central says this person may do in MTSS (role, permissions, whether it is active), or null when it has
// nothing for them. A retired application gives nobody access.
async function lookupApplicationEntitlement(personId) {
  try {
    const { data } = await getCentralClient().get("/application-entitlements/lookup", {
      params: { person_id: personId, application_id: APP_ID },
    });
    return data.data ?? null;
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.code === "application_retired") return null;
    throw error;
  }
}

// A short key that changes only when something MTSS keeps about a person's access changes (name, email, role,
// permissions or who is a member). Asking for it is one small call, so it can be asked every minute.
async function getApplicationEntitlementKey(applicationId = APP_ID) {
  const { data } = await getCentralClient().get("/application-entitlements/version", {
    params: { application_id: applicationId },
  });
  return data.data?.key ?? null;
}

// Everybody Central lists for this application, with the key of the moment they were read. Throws on any page
// failure instead of returning a partial list: callers revoke whoever is missing.
async function listApplicationEntitlements(applicationId = APP_ID) {
  const client = getCentralClient();
  const rows = [];
  let key = null;
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/application-entitlements", {
      params: { application_id: applicationId, page, size: ENTITLEMENT_PAGE_SIZE },
    });
    rows.push(...data.data);
    // A change between two pages gives a different key; the last one is the one to keep.
    key = data.key ?? key;
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return { rows, key };
}

module.exports = {
  getApplicationEntitlementKey,
  listApplicationEntitlements,
  lookupApplicationEntitlement,
  lookupEmployeeByPersonId,
  lookupEmployeeByEmail,
  lookupStudentByEmail,
  listStudentsByStatus,
  listActiveEmployees,
  listClassTeacherAssignments,
  listStudentSupportAssignments,
  getCentralClient,
};
