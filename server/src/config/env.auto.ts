// server/src/config/env.auto.ts

import { ENV } from "./env";

/**--------------------------------------------------------------------------------
    Backwards-compatible env export.
        ✅ New structure: `ENV` (env.ts) is the single source of truth.
        ✅ This file exists only so old code importing ENV_AUTO keeps working.
-----------------------------------------------------------------------------------*/
export const ENV_AUTO = {
    ...ENV,

    // legacy keys you referenced historically
    IS_DOCKER: ENV.IS_DOCKER,
    IS_LOCAL: ENV.IS_LOCAL,

    // keep legacy naming
    CORS_ORIGINS: ENV.CORS_ORIGINS,
};

// Debug (optional)
console.log("🌍 ENV_AUTO (shim):", {
    NODE_ENV: ENV_AUTO.NODE_ENV,
    IS_LOCAL: ENV_AUTO.IS_LOCAL,
    IS_DOCKER: ENV_AUTO.IS_DOCKER,
    IS_RENDER: ENV_AUTO.IS_RENDER,
    PORT: ENV_AUTO.PORT,
    DB_NAME: ENV_AUTO.DB_NAME,
    MONGO_URI: ENV_AUTO.MONGO_URI,
    ML_BASE_URL: ENV_AUTO.ML_BASE_URL,
    SERVER_URL: ENV_AUTO.SERVER_URL,
    CLIENT_URL: ENV_AUTO.CLIENT_URL,
    CORS_ORIGINS: ENV_AUTO.CORS_ORIGINS,
});
