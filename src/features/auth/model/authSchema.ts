import { z } from "zod";

export const registrationSchema = z
    .object({
        email: z.email(),
        password: z.string().min(6),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirm-password"],
    });

export const loginSchema = z.object({
    username: z.string().min(2),
    password: z.string().min(6),
});
