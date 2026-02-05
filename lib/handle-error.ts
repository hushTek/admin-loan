import { toast } from "sonner"
import { z } from "zod"

function isRedirectError(err: unknown): err is { digest: string } {
  if (typeof err !== "object" || err === null || !("digest" in err)) {
    return false
  }

  const { digest } = err as { digest: unknown }
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")
}

export function getErrorMessage(err: unknown) {
  const unknownError = "Something went wrong, please try again later."

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message
    })
    return errors.join("\n")
  } else if (err instanceof Error) {
    return err.message
  } else if (isRedirectError(err)) {
    throw new Error(err.digest)
  } else {
    return unknownError
  }
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err)
  return toast.error(errorMessage)
}