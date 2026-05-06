"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { ResetFormSchema } from "@/components/schema/user-form-schema"
import { FieldInput, FormInput } from "@/components/customs/form"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { authUserService } from "@/api/services/auth.service"
import { useState } from "react"
import { toast } from "react-toastify"

type ResetFormValues = z.infer<typeof ResetFormSchema>

const ForgetPassword = () => {
     const [loading, setLoading] = useState(false)

     const form = useForm<ResetFormValues>({
          resolver: zodResolver(ResetFormSchema),
          defaultValues: {
               email: "",
          },
     })

     const handleSubmit = async (data: ResetFormValues) => {
          try {
               setLoading(true)
               await authUserService.requestPasswordReset({ email: data.email })
               toast.success("Password reset link sent. Please check your email.")
               form.reset()
          } catch (error: unknown) {
               const errorMessage =
                    (error as { response?: { data?: { email?: string[]; detail?: string } } })?.response?.data
               const msg =
                    errorMessage?.detail ||
                    errorMessage?.email?.[0] ||
                    "Could not send reset link. Please try again."
               toast.error(msg)
          } finally {
               setLoading(false)
          }
     }

     return (
          <div className="flex items-center justify-center px-4">

               <div className="w-full max-w-md">
                    <FormInput
                         title="Reset Password"
                         description="Enter your email and we’ll send you a reset link"
                         className="border-0! shadow-none! ring-0! bg-transparent"
                    >
                         <form
                              onSubmit={form.handleSubmit(handleSubmit)}
                              className="space-y-5 mt-4"
                         >
                              {/* EMAIL */}
                              <FieldInput
                                   name="email"
                                   control={form.control}
                                   type="email"
                                   placeholder="Enter your email address"
                                   label="Email Address"
                              />

                              {/* LINKS */}
                              <div className="flex justify-between text-sm">
                                   <Link
                                        href="/login"
                                        className="text-chart-3 hover:underline"
                                   >
                                        Back to Login
                                   </Link>

                                   <Link
                                        href="/register"
                                        className="text-chart-3 hover:underline"
                                   >
                                        Create account
                                   </Link>
                              </div>

                              {/* SUBMIT */}
                              <Button
                                   type="submit"
                                   disabled={loading}
                                   className="w-full bg-chart-3 hover:opacity-90 transition p-5"
                              >
                                   {loading ? <Spinner /> : "Send Reset Link"}
                              </Button>
                         </form>
                    </FormInput>
               </div>
          </div>
     )
}

export default ForgetPassword
