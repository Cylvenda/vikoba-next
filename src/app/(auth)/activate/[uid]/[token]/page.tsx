"use client"

import { userServices } from "@/api/services/user.service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"

type ActivationState = "loading" | "success" | "error"

export default function ActivateAccountPage() {
     const params = useParams<{ uid: string; token: string }>()
     const router = useRouter()

     const uid = useMemo(() => params?.uid ?? "", [params?.uid])
     const token = useMemo(() => params?.token ?? "", [params?.token])

     const [status, setStatus] = useState<ActivationState>("loading")
     const [message, setMessage] = useState("Activating your account...")
     const [email, setEmail] = useState("")
     const [resending, setResending] = useState(false)

     useEffect(() => {
          const activateAccount = async () => {
               if (!uid || !token) {
                    setStatus("error")
                    setMessage("Invalid activation link.")
                    return
               }

               try {
                    await userServices.accountActivation({ uid, token })
                    setStatus("success")
                    setMessage("Account activated successfully. You can now log in.")
                    toast.success("Account activated successfully.")
               } catch (error: unknown) {
                    const detail =
                         (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                         "Activation failed. The link may be invalid or expired."

                    setStatus("error")
                    setMessage(detail)
               }
          }

          activateAccount()
     }, [token, uid])

     const handleResendActivation = async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()

          if (!email.trim()) {
               toast.error("Please enter your email address.")
               return
          }

          try {
               setResending(true)
               await userServices.emailActivation(email.trim())
               toast.success("Activation email sent. Please check your inbox.")
               setEmail("")
          } catch (error: unknown) {
               const detail =
                    (error as { response?: { data?: { detail?: string; email?: string[] } } })?.response?.data
               const msg = detail?.detail || detail?.email?.[0] || "Could not resend activation email."
               toast.error(msg)
          } finally {
               setResending(false)
          }
     }

     return (
          <div className="w-full max-w-md">
               <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                    <h1 className="text-2xl font-bold">Account Activation</h1>
                    <p className="text-sm text-muted-foreground">{message}</p>

                    {status === "success" && (
                         <Button className="w-full p-5 bg-chart-3 hover:bg-chart-2" onClick={() => router.push("/login")}>
                              Go to Login
                         </Button>
                    )}

                    {status === "loading" && (
                         <Button disabled className="w-full p-5">
                              Activating...
                         </Button>
                    )}

                    {status === "error" && (
                         <>
                              <form onSubmit={handleResendActivation} className="space-y-3">
                                   <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                   />
                                   <Button type="submit" disabled={resending} className="w-full p-5 bg-chart-3 hover:bg-chart-2">
                                        {resending ? "Sending..." : "Resend Activation Email"}
                                   </Button>
                              </form>

                              <p className="text-center text-sm text-muted-foreground">
                                   Back to <Link href="/login" className="text-chart-3 hover:underline">Login</Link>
                              </p>
                         </>
                    )}
               </div>
          </div>
     )
}
