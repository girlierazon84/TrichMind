import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { Request, Response } from "express";
import User from "../models/User";
import { ENV } from "../config/env";
import { RegisterDTO, LoginDTO } from "../schemas/userSchema";

const generateTokens = (userId: string) => {
    const accessToken = jwt.sign({ sub: userId }, ENV.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ sub: userId }, ENV.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
    try {
        const data = RegisterDTO.parse(req.body);
        const exists = await User.findOne({ email: data.email });
        if (exists) return res.status(409).json({ error: "Email already registered" });

        const user = await User.create(data);
        const { accessToken, refreshToken } = generateTokens(user.id);

        res.status(201).json({ ok: true, user, accessToken, refreshToken });
    } catch (e: any) {
        res.status(400).json({ error: e.message, details: e.errors });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = LoginDTO.parse(req.body);
        const user = await User.findOne({ email });
        if (!user || !(await user.compare(password)))
            return res.status(401).json({ error: "Invalid credentials" });

        const { accessToken, refreshToken } = generateTokens(user.id);
        res.json({ ok: true, user, accessToken, refreshToken });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Missing refresh token" });

        const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as any;
        const newAccessToken = jwt.sign({ sub: decoded.sub }, ENV.JWT_SECRET, { expiresIn: "15m" });
        res.json({ ok: true, accessToken: newAccessToken });
    } catch {
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ ok: true, message: "If the email exists, a reset link was sent." });

        const resetToken = jwt.sign({ sub: user._id }, ENV.JWT_SECRET, { expiresIn: "15m" });
        const resetLink = `${ENV.CLIENT_URL}/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            host: ENV.SMTP_HOST,
            port: Number(ENV.SMTP_PORT),
            secure: false,
            auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
        });

        await transporter.sendMail({
            from: `"TrichMind Support" <${ENV.SMTP_USER}>`,
            to: email,
            subject: "TrichMind Password Reset",
            html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
        });

        res.json({ ok: true, message: "Password reset link sent." });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
        const user = await User.findById(decoded.sub);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.password = newPassword;
        await user.save();

        res.json({ ok: true, message: "Password updated successfully" });
    } catch {
        res.status(400).json({ error: "Invalid or expired token" });
    }
};
