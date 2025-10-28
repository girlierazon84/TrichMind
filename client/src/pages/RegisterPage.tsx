import { useState } from "react";
import { authApi } from "../api/authApi";
import { ThemedButton } from "../components/ThemedButtons";

export default function RegisterPage() {
    const [form, setForm] = useState({ email: "", password: "", displayName: "" });
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authApi.register(form);
            setMessage("✅ Registration successful!");
            console.log(res);
        } catch (err: any) {
            setMessage(err.response?.data?.error || "❌ Registration failed");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "3rem auto", textAlign: "center" }}>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input name="displayName" placeholder="Name" onChange={handleChange} />
                <input name="email" type="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                <ThemedButton type="submit">Sign Up</ThemedButton>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}
