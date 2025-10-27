import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import { ThemedButton } from "../components/ThemedButtons";

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const token = params.get("token");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setMessage("❌ Invalid or missing token.");
            return;
        }

        try {
            const res = await authApi.resetPassword({ token, newPassword });
            setMessage(res.message || "✅ Password reset successful!");
        } catch (err: any) {
            setMessage("❌ Failed to reset password.");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "3rem auto", textAlign: "center" }}>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Enter new password"
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <ThemedButton type="submit">Reset Password</ThemedButton>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}
