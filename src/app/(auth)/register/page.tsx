"use client"

import { FieldInput, FormInput, PasswordInput } from "@/components/customs/form"
import { RegisterFormSchema } from "@/components/schema/user-form-schema"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { zodResolver } from "@hookform/resolvers/zod"
import { authUserService } from "@/api/services/auth.service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "react-toastify"
import { useForm } from "react-hook-form"
import { z } from "zod"

type RegisterFormValues = z.infer<typeof RegisterFormSchema>

const Register = () => {
     const [loading, setLoading] = useState(false)
     const router = useRouter()

     const form = useForm<RegisterFormValues>({
          resolver: zodResolver(RegisterFormSchema),
          defaultValues: {
               email: "",
               phone: "",
               password: "",
          },
     })

     const onSubmitHandler = async (data: RegisterFormValues) => {
          try {
               setLoading(true)
               const res = await authUserService.userRegister(data)

               if (res.status === 201) {
                    toast.success("Account created. Check your email to activate your account.")
                    router.push("/login")
               }

          } catch (error: unknown) {
               const errorMessage =
                    (error as { response?: { data?: { email?: string[]; phone?: string[]; password?: string[]; detail?: string } } })
                         ?.response?.data
               const msg =
                    errorMessage?.detail ||
                    errorMessage?.email?.[0] ||
                    errorMessage?.phone?.[0] ||
                    errorMessage?.password?.[0] ||
                    "Registration failed. Please try again."

               toast.error(msg)
          } finally {
               setLoading(false)
          }
     }

     return (
          <div className=" flex items-center justify-center ">

               {/* FORM WRAPPER */}
               <div className="w-full ">
                    <FormInput
                         title="Create Account"
                         description="Join Meeting Hub and start collaborating"
                         className="border-0! shadow-none! ring-0! bg-transparent"
                    >
                         <form
                              onSubmit={form.handleSubmit(onSubmitHandler)}
                              className="space-y-5 mt-2 p-2"
                         >
                              {/* EMAIL */}
                              <FieldInput
                                   control={form.control}
                                   type="email"
                                   name="email"
                                   placeholder="Enter email address"
                                   label="Email"
                              />

                              {/* PHONE */}
                              <FieldInput
                                   control={form.control}
                                   type="tel"
                                   name="phone"
                                   placeholder="Enter phone number"
                                   label="Phone"
                              />

                              {/* PASSWORD */}
                              <PasswordInput
                                   control={form.control}
                                   label="Password"
                                   name="password"
                                   placeholder="Enter password"
                              />

                              {/* LOGIN LINK */}
                              <div className="flex justify-end">
                                   <Link
                                        href="/login"
                                        className="text-sm text-chart-3 hover:underline"
                                   >
                                        Already have an account?
                                   </Link>
                              </div>

                              {/* SUBMIT */}
                              <Button
                                   type="submit"
                                   disabled={loading}
                                   className="w-full bg-chart-3 hover:opacity-90 transition p-5"
                              >
                                   {loading ? <Spinner /> : "Create Account"}
                              </Button>
                         </form>
                    </FormInput>
               </div>
          </div>
     )
}

export default Register
