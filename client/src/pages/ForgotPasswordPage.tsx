import { useState } from "react";
import { authApi } from "../api/authApi";
import { ThemedButton } from "../components/ThemedButtons";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authApi.forgotPassword(email);
            setMessage(res.message || "✅ If the email exists, a reset link has been sent.");
        } catch (err: any) {
            setMessage("❌ Failed to send reset email.");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "3rem auto", textAlign: "center" }}>
            <h2>Forgot Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <ThemedButton type="submit">Send Reset Link</ThemedButton>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}
