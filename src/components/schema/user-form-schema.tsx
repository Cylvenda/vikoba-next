import * as z from "zod"

export const RegisterFormSchema = z.object({
     email: z
          .string()
          .regex(
               /^[a-zA-Z][a-zA-Z0-9._]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
               "Email must contain only letters, numbers, dots or underscores and be a valid email"
          ),
     phone: z
          .string()
          .regex(
               /^(?:\+255|0)(6|7)\d{8}$/,
               "Phone number must start with 06 or 07 (or +2556/+2557) and be valid"
          )
          .transform((val) => val.replace(/[\s-]/g, "")) // remove spaces and dashes
          .transform((val) => {
               // Normalize to +2557xxxxxxxx format
               if (val.startsWith("0")) return "+255" + val.slice(1);
               return val; // already +255
          }),
     password: z
          .string()
          .min(1, "Password is required")
          .min(8, "Password must be at least 8 characters long")
          .max(20, "Password is too long")
          .max(20, "Password is too long")
          .regex(/[a-z]/, "Password must contain at least one lowercase letter")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[0-9]/, "Password must contain at least one number")
          .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
})


export const LoginFormSchema = z.object({
     email: z
          .string()
          .regex(
               /^[a-zA-Z][a-zA-Z0-9._]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
               "Email must contain only letters, numbers, dots or underscores and be a valid email"
          ),
     password: z
          .string()
          .min(1, "Password is required")
})

export const ResetFormSchema = z.object({
     email: z
          .string()
          .regex(
               /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
               "Email must contain only letters, numbers, dots or underscores and be a valid email"
          )
})

export const ResetConfirmFormSchema = z
     .object({
          newPassword: z
               .string()
               .min(8, "Password must be at least 8 characters long")
               .max(20, "Password is too long")
               .regex(/[a-z]/, "Password must contain at least one lowercase letter")
               .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
               .regex(/[0-9]/, "Password must contain at least one number")
               .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
          confirmPassword: z.string().min(1, "Confirm password is required"),
     })
     .refine((data) => data.newPassword === data.confirmPassword, {
          message: "Passwords do not match",
          path: ["confirmPassword"],
     })
