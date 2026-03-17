export default function Loading() {
  return (
    <div className="page-container safe-top">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-dark-muted">Loading...</p>
        </div>
      </div>
    </div>
  )
}
