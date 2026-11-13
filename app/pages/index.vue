<script setup lang="ts">
import { useClipboard } from "@vueuse/core"

useSeoMeta({
  title: "Gallery — Cloudflare R2 Blob Storage",
  description: "Simple image upload and download powered by Qarpeo and Cloudflare R2.",
})

interface GalleryImage {
  key: string
  size: number
  uploaded: string
}

function filename(key: string) {
  return key.replace(/^images\//, "")
}

const toast = useToast()

// 1. Fetch uploaded images from R2
const {
  data: images,
  refresh,
  pending,
} = await useFetch<GalleryImage[]>("/api/images", {
  default: () => [],
})

// 2. Client Blob Composable for programmatic upload & progress
const { upload, isUploading, progress } = useBlob("/api/images/upload", {
  accept: "image/*",
})

const uploadedFiles = ref<File[]>([])
const deletingKey = ref<string | null>(null)
const selectedImage = ref<GalleryImage | null>(null)
const isSlideoverOpen = ref(false)

function openDetails(img: GalleryImage) {
  selectedImage.value = img
  isSlideoverOpen.value = true
}

function formatDate(dateStr?: string | Date) {
  if (!dateStr) return "Unknown"
  return new Date(dateStr).toLocaleString()
}

watch(uploadedFiles, async (files) => {
  if (!files || files.length === 0) return
  const list = Array.isArray(files) ? [...files] : [files]
  uploadedFiles.value = []

  try {
    await Promise.all(list.map((file) => upload(file)))
    toast.add({
      title: "Uploaded!",
      description: `Uploaded ${list.length} image(s) to R2`,
      color: "success",
      icon: "i-lucide-check-circle",
    })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: "Upload failed",
      description: err?.data?.message || err.message,
      color: "error",
      icon: "i-lucide-alert-circle",
    })
  }
})

async function handleDelete(key: string) {
  deletingKey.value = key
  try {
    await $fetch(`/api/images/${key}`, { method: "DELETE" })
    toast.add({
      title: "Deleted",
      description: "Image removed from R2",
      icon: "i-lucide-trash-2",
    })
    if (selectedImage.value?.key === key) {
      isSlideoverOpen.value = false
      selectedImage.value = null
    }
    await refresh()
  } catch (err: any) {
    toast.add({
      title: "Delete failed",
      description: err?.data?.message || err.message,
      color: "error",
      icon: "i-lucide-alert-circle",
    })
  } finally {
    deletingKey.value = null
  }
}

const { copy, isSupported: isClipboardSupported } = useClipboard()

async function copyUrl(path: string) {
  const fullUrl = `${window.location.origin}${path}`
  if (isClipboardSupported.value) {
    await copy(fullUrl)
  }
  toast.add({
    title: "Link Copied!",
    description: "Image URL copied to clipboard",
    color: "info",
    icon: "i-lucide-clipboard-check",
  })
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
</script>

<template>
  <UMain>
    <UContainer class="space-y-10 py-12">
      <!-- Hero / Header -->
      <div class="space-y-3 text-center">
        <div class="inline-flex items-center gap-2">
          <UBadge color="primary" variant="subtle" size="md">
            <UIcon name="i-lucide-package" class="h-4 w-4" />
            Cloudflare R2 ($0 Egress)
          </UBadge>
        </div>
        <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">Edge Image Gallery</h1>
        <p class="text-muted mx-auto max-w-xl text-base">
          A zero-auth, edge-native image upload and download demo powered by Nuxt 5 and Qarpeo Blob
          storage.
        </p>
      </div>

      <!-- Upload Dropzone (Nuxt UI FileUpload) -->
      <div class="space-y-4">
        <UFileUpload
          v-model="uploadedFiles"
          accept="image/*"
          multiple
          label="Click to upload or drag and drop"
          description="PNG, JPG, WebP, GIF, SVG up to 15MB"
          icon="i-lucide-cloud-upload"
          :preview="false"
          class="w-full"
        />

        <!-- Progress indicator -->
        <div v-if="isUploading" class="mx-auto w-full max-w-sm space-y-1.5 text-center">
          <UProgress :value="progress" color="primary" size="sm" />
          <p class="text-muted text-xs">Uploading to Cloudflare R2... {{ progress }}%</p>
        </div>
      </div>

      <!-- Gallery Grid -->
      <div class="space-y-6">
        <div class="border-border border-default flex items-center justify-between border-b pb-4">
          <h2 class="flex items-center gap-2 text-xl font-bold">
            <UIcon name="i-lucide-images" class="text-primary h-5 w-5" />
            Uploaded Images
            <UBadge color="neutral" variant="subtle" size="sm">
              {{ images.length }}
            </UBadge>
          </h2>

          <UButton
            label="Refresh"
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-rotate-cw"
            :loading="pending"
            @click="refresh()"
          />
        </div>

        <!-- Empty State -->
        <UEmpty
          v-if="!pending && images.length === 0"
          icon="i-lucide-image"
          title="No images yet"
          description="Upload your first image above to store it directly in Cloudflare R2 object storage."
          variant="subtle"
        />

        <!-- Grid (Clean Image Grid) -->
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <BlobImage
            v-for="img in images"
            :key="img.key"
            :src="`/${img.key}`"
            :alt="filename(img.key)"
            fit="cover"
            format="webp"
            loading="eager"
            :width="400"
            :height="400"
            class="aspect-square h-full w-full cursor-pointer object-cover"
            @click="openDetails(img)"
          />
        </div>
      </div>

      <!-- Image Details Slideover -->
      <USlideover
        v-model:open="isSlideoverOpen"
        :title="selectedImage ? filename(selectedImage.key) : 'Image Details'"
        description="Cloudflare R2 Object"
      >
        <template v-if="selectedImage" #body>
          <div class="space-y-6">
            <!-- Image Preview -->
            <div
              class="bg-muted relative flex aspect-video max-h-72 w-full items-center justify-center overflow-hidden"
            >
              <BlobImage
                :src="`/${selectedImage.key}`"
                :alt="filename(selectedImage.key)"
                format="webp"
                fit="contain"
                loading="eager"
                class="max-h-full max-w-full object-contain"
              />
            </div>

            <!-- Metadata -->
            <div class="divide-default space-y-3 divide-y text-sm">
              <div class="flex items-center justify-between pb-2">
                <span class="text-muted">Filename</span>
                <span class="max-w-50 truncate font-medium" :title="filename(selectedImage.key)">
                  {{ filename(selectedImage.key) }}
                </span>
              </div>
              <div class="flex items-center justify-between pb-2">
                <span class="text-muted">Size</span>
                <span class="font-medium">{{ formatBytes(selectedImage.size) }}</span>
              </div>
              <div class="flex items-center justify-between pb-2">
                <span class="text-muted">Uploaded</span>
                <span class="font-medium">{{ formatDate(selectedImage.uploaded) }}</span>
              </div>
              <div class="flex items-center justify-between pb-2">
                <span class="text-muted">Key</span>
                <span
                  class="text-muted max-w-50 truncate font-mono text-xs"
                  :title="selectedImage.key"
                >
                  {{ selectedImage.key }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <template v-if="selectedImage" #footer>
          <div class="flex w-full items-center gap-2">
            <UButton
              :to="`/${selectedImage.key}?download=1`"
              external
              download
              color="primary"
              icon="i-lucide-download"
              label="Download"
              class="flex-1"
            />
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-copy"
              label="Copy Link"
              @click="copyUrl(`/${selectedImage.key}`)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              title="Delete image"
              :loading="deletingKey === selectedImage.key"
              @click="handleDelete(selectedImage.key)"
            />
          </div>
        </template>
      </USlideover>
    </UContainer>
  </UMain>
</template>
