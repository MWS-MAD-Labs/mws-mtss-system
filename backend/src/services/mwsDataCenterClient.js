const axios = require("axios");

const BASE_URL = process.env.MWS_DATA_CENTER_API_URL;
const API_TOKEN = process.env.MWS_DATA_CENTER_API_TOKEN;

const client = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_TOKEN}` },
  timeout: 5000,
});

async function lookupEmployeeByEmail(email) {
  try {
    const { data } = await client.get("/employees/lookup", {
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
    const { data } = await client.get("/students/lookup", {
      params: { email },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

module.exports = {
  lookupEmployeeByEmail,
  lookupStudentByEmail,
};
