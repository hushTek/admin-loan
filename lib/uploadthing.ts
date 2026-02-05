import { generateReactHelpers } from "@uploadthing/react"

import type { OurFileRouter } from "@/app/api/uploadthing/core"

import { type ClientUploadedFileData } from "uploadthing/types"

export interface UploadedFile<T = unknown> extends ClientUploadedFileData<T> {}

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>()