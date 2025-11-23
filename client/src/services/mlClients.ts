// client/src/services/mlClient.ts

import axios from "axios";

/**----------------------------------------------------------------
    ⚠️ Direct ML client (FastAPI)
    Normally you should go through the Node backend (/api/ml/*).
    This is kept only for debugging/tools.
-------------------------------------------------------------------*/
const mlBaseURL = import.meta.env.VITE_ML_BASE_URL || "http://localhost:8000";

// Axios Client for ML service
const mlClient = axios.create({
    baseURL: mlBaseURL,
    timeout: 6000,
});

// Export the configured ML client
export default mlClient;
