// client/src/services/predictApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";
import type { PredictPayload, PredictionResponse } from "@/types/ml";


/**----------------------------------------------------------
    🔮 Predict API — communicates with ML backend
    Uses FastAPI endpoint: POST /api/ml/predict_friendly
    (axiosClient baseURL already ends with /api)
-------------------------------------------------------------*/

/**-------------------------------------------------------------------
    Raw API function to send prediction request to the ML backend.
----------------------------------------------------------------------*/
export async function rawPredict(
    payload: PredictPayload
): Promise<PredictionResponse> {
    // baseURL: http://localhost:8080/api
    // final URL: http://localhost:8080/api/ml/predict_friendly
    const res = await axiosClient.post("/ml/predict_friendly", payload);
    return res.data;
}

/**--------------------------------------------------
    Wrapped API (with automatic logging + toasts)
-----------------------------------------------------*/
export const predictApi = {
    predict: withLogging(rawPredict, {
        category: "ml",
        action: "predict",
        showToast: true,
        successMessage: "Prediction completed successfully!",
        errorMessage: "Prediction request failed. Please try again.",
    }),
};

export default predictApi;
