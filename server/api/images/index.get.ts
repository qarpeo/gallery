import { defineEventHandler } from "nuxt/server"

export default defineEventHandler(async () => {
  const { objects } = await blob.list({ prefix: "images/" })
  return objects
})
