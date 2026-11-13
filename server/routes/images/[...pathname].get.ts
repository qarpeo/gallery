import { createError, defineEventHandler, getQuery, getRouterParam } from "nuxt/server"

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname")
  if (!pathname) {
    throw createError({ statusCode: 400, message: "Missing image path" })
  }

  const query = getQuery(event)
  const isDownload = query.download !== undefined

  const filename = pathname.split("/").pop() || "image"
  const options = isDownload
    ? { contentDisposition: `attachment; filename="${filename}"` }
    : undefined

  return await blob.serve(event, `images/${pathname}`, options)
})
