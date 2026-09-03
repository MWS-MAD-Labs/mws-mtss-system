const axios = require("axios");

function buildCentralLookupError(message) {
  const error = new Error(message);
  error.isCentralLookupError = true;
  return error;
}

function getCentralClient() {
  const baseUrl =
    process.env.MWS_DATA_CENTER_API_URL || process.env.CENTRAL_API_BASE_URL;
  const apiToken =
    process.env.MWS_DATA_CENTER_API_TOKEN || process.env.CENTRAL_API_TOKEN;

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
    headers: { Authorization: `Bearer ${apiToken}` },
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

module.exports = {
  lookupEmployeeByEmail,
  lookupStudentByEmail,
  listStudentsByStatus,
  listActiveEmployees,
  getCentralClient,
};
