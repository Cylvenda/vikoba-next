"use client";

import { FieldInput, FormInput, PasswordInput } from "@/components/customs/form";
import { RegisterFormSchema } from "@/components/schema/user-form-schema";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { authUserService } from "@/api/services/auth.service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLanguage } from "@/components/language/language-provider";

type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmitHandler = async (data: RegisterFormValues) => {
    try {
      setLoading(true);
      const res = await authUserService.userRegister(data);

      if (res.status === 201) {
        toast.success(tt("Account created successfully. Check your email to activate your account.", "Akaunti imeundwa. Angalia barua pepe yako ili kuiwezesha."));
        router.push("/login");
      }
    } catch (error: unknown) {
      const errorMessage = (
        error as {
          response?: {
            data?: {
              email?: string[];
              phone?: string[];
              password?: string[];
              detail?: string;
            };
          };
        }
      )?.response?.data;
      
      const msg =
        errorMessage?.detail ||
        errorMessage?.email?.[0] ||
        errorMessage?.phone?.[0] ||
        errorMessage?.password?.[0] ||
        tt("Registration failed. Please try again.", "Usajili umeshindikana. Tafadhali jaribu tena.");

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-inherit">
      <FormInput
        title={tt("Create Account", "Fungua Akaunti")}
        description={tt("Join Community Hub and launch your VICOBA digital space", "Jiunge na Community Hub na uanzishe nafasi yako ya VICOBA mtandaoni")}
      >
        <form
          onSubmit={form.handleSubmit(onSubmitHandler)}
          className="space-y-6 mt-4"
        >
          {/* EMAIL */}
          <FieldInput
            control={form.control}
            type="email"
            name="email"
            placeholder={tt("Enter email address", "Ingiza anwani ya barua pepe")}
            label={tt("Email Address", "Anwani ya Barua Pepe")}
          />

          {/* PHONE */}
          <FieldInput
            control={form.control}
            type="tel"
            name="phone"
            placeholder={tt("Enter phone number", "Ingiza namba ya simu")}
            label={tt("Phone Number", "Namba ya Simu")}
          />

          {/* PASSWORD */}
          <PasswordInput
            control={form.control}
            label={tt("Password", "Nenosiri")}
            name="password"
            placeholder={tt("Enter password", "Ingiza nenosiri")}
          />

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
          >
            {loading ? <Spinner /> : tt("Create Account", "Fungua Akaunti")}
          </Button>

          {/* LOGIN REDIRECT LINK */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            {tt("Already have an account?", "Tayari una akaunti?")}{" "}
            <Link
              href="/login"
              className="text-chart-3 hover:text-chart-2 font-bold hover:underline transition-colors duration-300"
            >
              {tt("Sign in", "Ingia")}
            </Link>
          </p>
        </form>
      </FormInput>
    </div>
  );
};

export default Register;
