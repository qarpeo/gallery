import { createError, defineEventHandler, getRouterParam } from "nuxt/server"

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname")
  if (!pathname) {
    throw createError({ statusCode: 400, message: "Missing image path" })
  }

  await blob.delete(pathname)
  return { ok: true }
})
