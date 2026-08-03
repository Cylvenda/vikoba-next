"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormInput, FieldInput, PasswordInput } from "@/components/customs/form";
import Link from "next/link";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useState } from "react";
import { authUserService } from "@/api/services/auth.service";
import { LoginFormSchema } from "@/components/schema/user-form-schema";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/components/language/language-provider";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

type LoginFormValues = z.infer<typeof LoginFormSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { fetchUser } = useAuthUserStore();
  const { language } = useLanguage();
  const isSwahili = language === "sw";
  const tt = (en: string, sw: string) => (isSwahili ? sw : en);
  const accountCreated = searchParams.get("registered") === "1";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      const res = await authUserService.userLogin(data);

      if (res.status === 200) {
        // Wait briefly for cookie to sync (helps in dev)
        await new Promise((resolve) => setTimeout(resolve, 200));

        const currentUser = await fetchUser();

        if (!currentUser) {
          toast.error(tt("Login succeeded, but failed to load your profile.", "Umefanikiwa kuingia, lakini imeshindikana kupakia wasifu wako."));
          return;
        }

        if (!currentUser.isActive) {
          toast.warning(tt("Your account is not activated yet.", "Akaunti yako bado haijaamilishwa."));
          return;
        }

        router.replace(currentUser.isAdmin ? "/admin" : "/home");
      }
    } catch {
      toast.error(tt("Login failed. Check credentials.", "Kuingia kumeshindikana. Kagua taarifa zako."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-inherit">
      <FormInput
        title={tt("Welcome Back", "Karibu Tena")}
        description={tt("Login to your Community Hub account to continue", "Ingia kwenye akaunti yako ya Community Hub ili uendelee")}
      >
        {accountCreated && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold">
                  {tt("Account created successfully.", "Akaunti imeundwa kwa mafanikio.")}
                </p>
                <p>
                  {tt(
                    "Before signing in, please verify your account using the activation link we sent to your email inbox.",
                    "Kabla ya kuingia, tafadhali hakiki akaunti yako kwa kutumia kiungo cha uanzishaji tulichotuma kwenye kikasha chako cha barua pepe.",
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* EMAIL */}
          <FieldInput
            control={form.control}
            name="email"
            type="email"
            label={tt("Email Address", "Anwani ya barua pepe")}
            placeholder={tt("Enter your email", "Weka barua pepe yako")}
          />

          {/* PASSWORD */}
          <PasswordInput
            control={form.control}
            name="password"
            label={tt("Password", "Nenosiri")}
            placeholder={tt("Enter your password", "Weka nenosiri lako")}
            forgetPassword={{
              text: tt("Forgot password?", "Umesahau nenosiri?"),
              location: "/reset",
            }}
          />

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
          >
            {loading ? <Spinner /> : tt("Sign In", "Ingia")}
          </Button>

          {/* FOOTER REDIRECT */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            {tt("Don’t have an account?", "Huna akaunti?")}{" "}
            <Link
              href="/register"
              className="text-chart-3 hover:text-chart-2 font-bold hover:underline transition-colors duration-300"
            >
              {tt("Sign up", "Jisajili")}
            </Link>
          </p>
        </form>
      </FormInput>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
