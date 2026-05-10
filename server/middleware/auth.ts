import { auth } from "~~/lib/auth"
import { fromNodeHeaders } from "better-auth/node"

export default defineEventHandler(async (event) => {
  if (event.path.startsWith("/api/auth")) return

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(event.node.req.headers),
    })
    event.context.session = session
  } catch {
    event.context.session = null
  }
})
