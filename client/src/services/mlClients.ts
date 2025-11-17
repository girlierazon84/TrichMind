// client/src/services/mlClient.ts

import axios from "axios";

const mlClient = axios.create({
    baseURL: "http://localhost:8000", // FastAPI root
    timeout: 6000,
});

export default mlClient;
