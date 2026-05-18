"use client";

import { authUserService } from "@/api/services/auth.service";
import { PasswordInput, FormInput } from "@/components/customs/form";
import { ResetConfirmFormSchema } from "@/components/schema/user-form-schema";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

type ResetConfirmFormValues = z.infer<typeof ResetConfirmFormSchema>;

export default function ResetPasswordConfirmPage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const uid = params?.uid ?? "";
  const token = params?.token ?? "";

  const form = useForm<ResetConfirmFormValues>({
    resolver: zodResolver(ResetConfirmFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetConfirmFormValues) => {
    if (!uid || !token) {
      toast.error("Invalid reset link.");
      return;
    }

    try {
      setLoading(true);
      await authUserService.confirmPasswordReset({
        uid,
        token,
        new_password: data.newPassword,
      });

      toast.success("Password reset successful. Please log in.");
      router.push("/login");
    } catch (error: unknown) {
      const errorData = (
        error as { response?: { data?: { detail?: string; token?: string[] } } }
      )?.response?.data;
      
      const msg =
        errorData?.detail ||
        errorData?.token?.[0] ||
        "Could not reset password. The link may be invalid or expired.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <FormInput
        title="Set New Password"
        description="Choose a strong, secure password for your account"
      >
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 mt-4"
        >
          {/* NEW PASSWORD */}
          <PasswordInput
            control={form.control}
            name="newPassword"
            label="New Password"
            placeholder="Enter new password"
          />

          {/* CONFIRM PASSWORD */}
          <PasswordInput
            control={form.control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter new password"
          />

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
          >
            {loading ? <Spinner /> : "Update Password"}
          </Button>

          {/* BACK TO LOGIN */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            Back to{" "}
            <Link
              href="/login"
              className="text-chart-3 hover:text-chart-2 font-bold hover:underline transition-colors duration-300"
            >
              Login
            </Link>
          </p>
        </form>
      </FormInput>
    </div>
  );
}
