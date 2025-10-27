import { useState } from "react";
import { authApi } from "../api/authApi";
import { ThemedButton } from "../components/ThemedButtons";

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authApi.login(form);
            setMessage("✅ Logged in successfully!");
            console.log(res);
            localStorage.setItem("token", res.accessToken);
        } catch (err: any) {
            setMessage(err.response?.data?.error || "❌ Login failed");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "3rem auto", textAlign: "center" }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input name="email" type="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                <ThemedButton type="submit">Login</ThemedButton>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}
