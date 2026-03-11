type SignedUrlCapableClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number
      ) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>
    }
  }
}

function normalizeStoragePath(rawValue: string | null | undefined, bucket: string) {
  if (!rawValue || rawValue.startsWith('blob:')) {
    return null
  }

  if (/^https?:\/\//i.test(rawValue)) {
    const bucketMarker = `/${bucket}/`
    const markerIndex = rawValue.indexOf(bucketMarker)

    if (markerIndex === -1) {
      return null
    }

    return decodeURIComponent(rawValue.slice(markerIndex + bucketMarker.length).split('?')[0])
  }

  return rawValue.replace(/^\/+/, '')
}

export async function signStorageUrl(
  supabase: SignedUrlCapableClient,
  bucket: string,
  rawValue: string | null | undefined,
  expiresIn = 60 * 60
) {
  const path = normalizeStoragePath(rawValue, bucket)

  if (!path) {
    return rawValue ?? null
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    console.error(`Failed to sign ${bucket} object`, error?.message ?? rawValue)
    return rawValue ?? null
  }

  return data.signedUrl
}

export async function signExpenseReceiptUrls<T extends { receipt_image_url: string | null }>(
  supabase: SignedUrlCapableClient,
  expenses: T[]
) {
  return Promise.all(
    expenses.map(async (expense) => ({
      ...expense,
      receipt_image_url: await signStorageUrl(supabase, 'receipts', expense.receipt_image_url),
    }))
  )
}
