import { NextRequest, NextResponse } from "next/server"

const BACKEND_API_ROOT = normalizeApiRoot(
     process.env.BACKEND_API_BASE || "http://127.0.0.1:8000/api/"
)

const ACCESS_COOKIE_MAX_AGE = 60 * 10
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24

function normalizeApiRoot(value: string) {
     return value.endsWith("/") ? value : `${value}/`
}

function buildBackendUrl(pathSegments: string[], request: NextRequest) {
     const pathname = pathSegments.join("/")
     const url = new URL(`${pathname}/`, BACKEND_API_ROOT)
     url.search = request.nextUrl.search
     return url
}

function getCookieOptions(maxAge: number) {
     return {
          httpOnly: true,
          sameSite: "lax" as const,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge,
     }
}

function allowsResponseBody(status: number) {
     return ![204, 205, 304].includes(status)
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
     const { path } = await context.params
     const targetUrl = buildBackendUrl(path, request)
     const cookieHeader = request.headers.get("cookie")
     const contentType = request.headers.get("content-type")

     const headers = new Headers()
     if (cookieHeader) {
          headers.set("cookie", cookieHeader)
     }
     if (contentType) {
          headers.set("content-type", contentType)
     }
     headers.set("accept", "application/json")

     const backendResponse = await fetch(targetUrl, {
          method: request.method,
          headers,
          body:
               request.method === "GET" || request.method === "HEAD"
                    ? undefined
                    : await request.text(),
          cache: "no-store",
     })

     const rawContentType = backendResponse.headers.get("content-type") || "application/json"
     const responseText = await backendResponse.text()
     const response = allowsResponseBody(backendResponse.status)
          ? new NextResponse(responseText, {
                 status: backendResponse.status,
                 headers: {
                      "content-type": rawContentType,
                 },
            })
          : new NextResponse(null, {
                 status: backendResponse.status,
            })

     const isLogin = path.join("/") === "me/auth/login"
     const joinedPath = path.join("/")
     const isRefresh = joinedPath === "me/auth/refresh" || joinedPath === "me/auth/csrf"
     const isLogout = path.join("/") === "me/auth/logout"

     let parsedBody: Record<string, unknown> | null = null
     if (rawContentType.includes("application/json") && responseText) {
          try {
               parsedBody = JSON.parse(responseText) as Record<string, unknown>
          } catch {
               parsedBody = null
          }
     }

     if ((isLogin || isRefresh) && parsedBody) {
          const accessToken =
               typeof parsedBody.access === "string" ? parsedBody.access : null
          const refreshToken =
               typeof parsedBody.refresh === "string" ? parsedBody.refresh : null

          if (accessToken) {
               response.cookies.set("access", accessToken, getCookieOptions(ACCESS_COOKIE_MAX_AGE))
          }

          if (refreshToken) {
               response.cookies.set("refresh", refreshToken, getCookieOptions(REFRESH_COOKIE_MAX_AGE))
          }
     }

     if (isLogout) {
          response.cookies.delete("access")
          response.cookies.delete("refresh")
     }

     return response
}

export async function GET(
     request: NextRequest,
     context: { params: Promise<{ path: string[] }> }
) {
     return proxy(request, context)
}

export async function POST(
     request: NextRequest,
     context: { params: Promise<{ path: string[] }> }
) {
     return proxy(request, context)
}

export async function PATCH(
     request: NextRequest,
     context: { params: Promise<{ path: string[] }> }
) {
     return proxy(request, context)
}

export async function PUT(
     request: NextRequest,
     context: { params: Promise<{ path: string[] }> }
) {
     return proxy(request, context)
}

export async function DELETE(
     request: NextRequest,
     context: { params: Promise<{ path: string[] }> }
) {
     return proxy(request, context)
}
