"use client";

import { userServices } from "@/api/services/user.service";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language/language-provider";

type ActivationState = "loading" | "success" | "error";

export default function ActivateAccountPage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;

  const uid = useMemo(() => params?.uid ?? "", [params?.uid]);
  const token = useMemo(() => params?.token ?? "", [params?.token]);

  const [status, setStatus] = useState<ActivationState>("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const activateAccount = async () => {
      if (!uid || !token) {
        setStatus("error");
        setMessage(language === "sw" ? "Kiungo cha kuwezesha akaunti si sahihi." : "Invalid activation link.");
        return;
      }

      try {
        await userServices.accountActivation({ uid, token });
        setStatus("success");
        setMessage(language === "sw" ? "Akaunti imewezeshwa. Sasa unaweza kuingia kwenye Community Hub." : "Account activated successfully. You can now log in to the Community Hub platform.");
        toast.success(language === "sw" ? "Akaunti imewezeshwa." : "Account activated successfully.");
      } catch (error: unknown) {
        const detail =
          (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          (language === "sw" ? "Uwezeshaji umeshindikana. Kiungo kinaweza kuwa si sahihi au muda wake umeisha." : "Activation failed. The link may be invalid or expired.");

        setStatus("error");
        setMessage(detail);
      }
    };

    activateAccount();
  }, [language, token, uid]);

  const handleResendActivation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error(tt("Please enter your email address.", "Tafadhali ingiza anwani yako ya barua pepe."));
      return;
    }

    try {
      setResending(true);
      await userServices.emailActivation(email.trim());
      toast.success(tt("Activation email sent. Please check your inbox.", "Barua ya kuwezesha akaunti imetumwa. Angalia kikasha chako."));
      setEmail("");
    } catch (error: unknown) {
      const detail =
        (error as { response?: { data?: { detail?: string; email?: string[] } } })?.response?.data;
      const msg = detail?.detail || detail?.email?.[0] || tt("Could not resend activation email.", "Imeshindikana kutuma tena barua ya kuwezesha akaunti.");
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {tt("Account Activation", "Uwezeshaji wa Akaunti")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {tt("Confirming your access to the Community Hub workspace", "Tunathibitisha ufikiaji wako wa Community Hub")}
          </p>
        </div>

        {/* LOADING STATE CARD */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border bg-card/40 backdrop-blur-sm text-center space-y-4">
            <Loader2 className="h-8 w-8 text-chart-3 animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">{message}</p>
            <Button disabled className="w-full py-6">
              {tt("Activating Account...", "Inawezesha Akaunti...")}
            </Button>
          </div>
        )}

        {/* SUCCESS STATE CARD */}
        {status === "success" && (
          <div className="p-6 rounded-2xl border border-green-500/20 bg-green-500/10 dark:bg-green-500/5 space-y-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-green-800 dark:text-green-400">
                  {tt("Verification Complete", "Uthibitishaji Umekamilika")}
                </h3>
                <p className="text-xs text-green-700/90 dark:text-green-500/80 mt-1 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            
            <Button
              className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
              onClick={() => router.push("/login")}
            >
              {tt("Go to Login", "Nenda Kuingia")}
            </Button>
          </div>
        )}

        {/* ERROR/EXPIRED STATE CARD */}
        {status === "error" && (
          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/10 dark:bg-destructive/5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-destructive">
                  {tt("Activation Failed", "Uwezeshaji Umeshindikana")}
                </h3>
                <p className="text-xs text-destructive/90 mt-1 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
              <p className="text-xs font-medium text-muted-foreground">
                {tt("Need a new verification link? Enter your email below to request one.", "Unahitaji kiungo kipya cha uthibitishaji? Ingiza barua pepe yako hapa chini.")}
              </p>
              
              <form onSubmit={handleResendActivation} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={tt("Enter your email", "Ingiza barua pepe yako")}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-chart-3/40 focus-visible:border-chart-3 transition-all"
                />
                
                <Button
                  type="submit"
                  disabled={resending}
                  className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
                >
                  {resending ? tt("Sending...", "Inatuma...") : tt("Resend Activation Email", "Tuma Tena Barua ya Uwezeshaji")}
                </Button>
              </form>
            </div>

            <p className="text-center text-sm text-muted-foreground font-medium">
              {tt("Back to", "Rudi")}{" "}
              <Link href="/login" className="text-chart-3 hover:text-chart-2 font-bold hover:underline transition-colors duration-300">
                {tt("Login", "Kuingia")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
