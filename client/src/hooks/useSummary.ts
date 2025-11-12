// client/src/hooks/useSummary.ts

import { useState } from "react";
import { toast } from "react-toastify";
import { summaryApi, type SummaryLog } from "@/services";
import { useLogger } from "@/hooks";


export const useSummary = () => {
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

    const create = async (data: Omit<SummaryLog, "_id" | "createdAt">) => {
        setLoading(true);
        try {
            const res = await summaryApi.create(data);
            await log("Summary created", { avgRisk: data.avgRisk });
            toast.success("Weekly summary ready!");
            return res;
        } finally {
            setLoading(false);
        }
    };

    return { create, loading };
}

export default useSummary;