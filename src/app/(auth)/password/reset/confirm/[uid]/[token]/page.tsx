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
import { useLanguage } from "@/components/language/language-provider";

type ResetConfirmFormValues = z.infer<typeof ResetConfirmFormSchema>;

export default function ResetPasswordConfirmPage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;

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
      toast.error(tt("Invalid reset link.", "Kiungo cha kuweka upya si sahihi."));
      return;
    }

    try {
      setLoading(true);
      await authUserService.confirmPasswordReset({
        uid,
        token,
        new_password: data.newPassword,
      });

      toast.success(tt("Password reset successful. Please log in.", "Nenosiri limewekwa upya. Tafadhali ingia."));
      router.push("/login");
    } catch (error: unknown) {
      const errorData = (
        error as { response?: { data?: { detail?: string; token?: string[] } } }
      )?.response?.data;
      
      const msg =
        errorData?.detail ||
        errorData?.token?.[0] ||
        tt("Could not reset password. The link may be invalid or expired.", "Imeshindikana kuweka upya nenosiri. Kiungo kinaweza kuwa si sahihi au muda wake umeisha.");

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-inherit">
      <FormInput
        title={tt("Set New Password", "Weka Nenosiri Jipya")}
        description={tt("Choose a strong, secure password for your account", "Chagua nenosiri imara na salama kwa akaunti yako")}
      >
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 mt-4"
        >
          {/* NEW PASSWORD */}
          <PasswordInput
            control={form.control}
            name="newPassword"
            label={tt("New Password", "Nenosiri Jipya")}
            placeholder={tt("Enter new password", "Ingiza nenosiri jipya")}
          />

          {/* CONFIRM PASSWORD */}
          <PasswordInput
            control={form.control}
            name="confirmPassword"
            label={tt("Confirm Password", "Thibitisha Nenosiri")}
            placeholder={tt("Re-enter new password", "Ingiza tena nenosiri jipya")}
          />

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
          >
            {loading ? <Spinner /> : tt("Update Password", "Sasisha Nenosiri")}
          </Button>

          {/* BACK TO LOGIN */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            {tt("Back to", "Rudi")}{" "}
            <Link
              href="/login"
              className="text-chart-3 hover:text-chart-2 font-bold hover:underline transition-colors duration-300"
            >
              {tt("Login", "Kuingia")}
            </Link>
          </p>
        </form>
      </FormInput>
    </div>
  );
}
