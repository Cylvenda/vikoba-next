"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ResetFormSchema } from "@/components/schema/user-form-schema";
import { FieldInput, FormInput } from "@/components/customs/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authUserService } from "@/api/services/auth.service";
import { useState } from "react";
import { toast } from "react-toastify";
import { useLanguage } from "@/components/language/language-provider";

type ResetFormValues = z.infer<typeof ResetFormSchema>;

const ForgetPassword = () => {
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(ResetFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (data: ResetFormValues) => {
    try {
      setLoading(true);
      await authUserService.requestPasswordReset({ email: data.email });
      toast.success(tt("Password reset link sent. Please check your email.", "Kiungo cha kuweka upya nenosiri kimetumwa. Angalia barua pepe yako."));
      form.reset();
    } catch (error: unknown) {
      const errorMessage = (
        error as { response?: { data?: { email?: string[]; detail?: string } } }
      )?.response?.data;
      
      const msg =
        errorMessage?.detail ||
        errorMessage?.email?.[0] ||
        tt("Could not send reset link. Please try again.", "Imeshindikana kutuma kiungo. Tafadhali jaribu tena.");
      
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-inherit">
      <FormInput
        title={tt("Reset Password", "Weka Upya Nenosiri")}
        description={tt("Enter your email and we'll send you a password recovery link", "Ingiza barua pepe yako, tutakutumia kiungo cha kurejesha nenosiri")}
      >
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6 mt-4"
        >
          {/* EMAIL */}
          <FieldInput
            name="email"
            control={form.control}
            type="email"
            placeholder={tt("Enter your email address", "Ingiza anwani yako ya barua pepe")}
            label={tt("Email Address", "Anwani ya Barua Pepe")}
          />

          {/* BACK NAVIGATION LINKS */}
          <div className="flex justify-between items-center text-sm font-medium">
            <Link
              href="/login"
              className="text-chart-3 hover:text-chart-2 hover:underline transition-colors duration-300"
            >
              {tt("Back to Login", "Rudi Kuingia")}
            </Link>

            <Link
              href="/register"
              className="text-chart-3 hover:text-chart-2 hover:underline transition-colors duration-300"
            >
              {tt("Create Account", "Fungua Akaunti")}
            </Link>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
          >
            {loading ? <Spinner /> : tt("Send Reset Link", "Tuma Kiungo")}
          </Button>
        </form>
      </FormInput>
    </div>
  );
};

export default ForgetPassword;
