const fs = require("fs");
const axios = require("axios");
const path = require("path");

/**
 * Extracts Axios-ready call (method, url, params, data) from OpenAPI JSON by operationId
 * @param {string} openApiFilePath - Path to the OpenAPI JSON file
 * @param {string} operationId - Operation ID to look for
 * @returns {Promise<Object>} - Axios request object { method, url, params, data }
 */
async function getAxiosCallFromOpenAPI(openApiFilePath, operationId) {
  const openApi = JSON.parse(fs.readFileSync(openApiFilePath, "utf-8"));

  const serverUrl = openApi.servers?.[0]?.url || "";
  const paths = openApi.paths;

  for (const [route, methods] of Object.entries(paths)) {
    for (const [method, config] of Object.entries(methods)) {
      if (config.operationId === operationId) {
        const url = path.join(serverUrl, route).replace(/\/+$/, "");

        const hasParams = (config.parameters || []).filter(
          (p) => p.in === "query"
        );
        const hasBody = config.requestBody;

        return {
          method,
          url,
          params: hasParams.length ? {} : undefined,
          data: hasBody ? {} : undefined,
        };
      }
    }
  }

  throw new Error(`operationId "${operationId}" not found in OpenAPI`);
}

(async () => {
  try {
    const axiosConfig = await getAxiosCallFromOpenAPI(
      "./openapi.json",
      "getAllUsers"
    );

    const response = await axios({
      method: axiosConfig.method,
      url: axiosConfig.url,
      params: axiosConfig.params,
      data: axiosConfig.data,
    });

    console.log(response.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
