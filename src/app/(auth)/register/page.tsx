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

type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        toast.success("Account created successfully. Check your email to activate your account.");
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
        "Registration failed. Please try again.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <FormInput
        title="Create Account"
        description="Join Community Hub and launch your VICOBA digital space"
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
            placeholder="Enter email address"
            label="Email Address"
          />

          {/* PHONE */}
          <FieldInput
            control={form.control}
            type="tel"
            name="phone"
            placeholder="Enter phone number"
            label="Phone Number"
          />

          {/* PASSWORD */}
          <PasswordInput
            control={form.control}
            label="Password"
            name="password"
            placeholder="Enter password"
          />

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
          >
            {loading ? <Spinner /> : "Create Account"}
          </Button>

          {/* LOGIN REDIRECT LINK */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-chart-3 hover:text-chart-2 font-bold hover:underline transition-colors duration-300"
            >
              Sign in
            </Link>
          </p>
        </form>
      </FormInput>
    </div>
  );
};

export default Register;
