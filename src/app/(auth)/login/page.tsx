"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormInput, FieldInput, PasswordInput } from "@/components/customs/form"
import Link from "next/link"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useState } from "react"
import { authUserService } from "@/api/services/auth.service"
import { LoginFormSchema } from "@/components/schema/user-form-schema"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Spinner } from "@/components/ui/spinner"


type LoginFormValues = z.infer<typeof LoginFormSchema>

export default function LoginPage() {

     const router = useRouter()
     const [loading, setLoading] = useState(false)
     const { fetchUser } = useAuthUserStore()

     const form = useForm<LoginFormValues>({
          resolver: zodResolver(LoginFormSchema),
          defaultValues: {
               email: "",
               password: "",
          },
     })

     const onSubmit = async (data: LoginFormValues) => {
          setLoading(true)

          try {
               const res = await authUserService.userLogin(data)

               if (res.status === 200) {
                    // Wait briefly for cookie to sync (optional, helps in dev)
                    await new Promise(resolve => setTimeout(resolve, 200))

                    const currentUser = await fetchUser()

                    if (!currentUser) {
                         toast.error("Login succeeded, but failed to load your profile.")
                         return
                    }

                    if (!currentUser.isActive) {
                         toast.warning("Your account is not activated yet.")
                         return
                    }

                    router.replace(currentUser.isAdmin ? "/admin" : "/dashboard")
                    router.refresh()
               }
          } catch {
               toast.error("Login failed. Check credentials.")
          } finally {
               setLoading(false)
          }
     }


     return (
          <div className="w-full">
               <FormInput
                    title="Welcome Back"
                    description="Login to your account to continue"
               >
                    <form
                         onSubmit={form.handleSubmit(onSubmit)}
                         className="space-y-5"
                    >
                         {/* EMAIL */}
                         <FieldInput
                              control={form.control}
                              name="email"
                              type="email"
                              label="Email"
                              placeholder="Enter your email"
                         />

                         {/* PASSWORD */}
                         <PasswordInput
                              control={form.control}
                              name="password"
                              label="Password"
                              placeholder="Enter your password"
                              forgetPassword={{
                                   text: "Forgot password?",
                                   location: "/reset",
                              }}
                         />

                         {/* SUBMIT */}
                         <Button type="submit" disabled={loading} className="w-full p-5 bg-chart-3 hover:bg-chart-2">
                              {loading ? <Spinner /> : "Sign In"}
                         </Button>

                         {/* FOOTER */}
                         <p className="text-center text-sm text-muted-foreground">
                              Don’t have an account?{" "}
                              <Link
                                   href="/register"
                                   className="text-chart-3 hover:underline"
                              >
                                   Sign up
                              </Link>
                         </p>
                    </form>
               </FormInput>
          </div>
     )
}
