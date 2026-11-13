import { defineEventHandler } from "nuxt/server"

export default defineEventHandler(async (event) => {
  return await handleUpload(event, {
    ensure: {
      maxSize: "15MB",
      types: ["image/*"],
    },
    put: {
      prefix: "images",
      addRandomSuffix: true,
    },
  })
})
