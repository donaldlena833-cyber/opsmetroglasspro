import { cn } from '@/lib/utils'

interface PageHeroStat {
  label: string
  value: string
  hint?: string
}

interface PageHeroProps {
  eyebrow?: string
  title: string
  description: string
  actions?: React.ReactNode
  stats?: PageHeroStat[]
  className?: string
}

export function PageHero({ eyebrow, title, description, actions, stats = [], className }: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative mb-6 overflow-hidden rounded-[34px] border border-cream-200/90 bg-white/88 p-6 shadow-card-lg backdrop-blur-sm dark:border-dark-border dark:bg-dark-card/90 dark:shadow-card-dark',
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,138,82,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,51,45,0.08),transparent_32%)]" />

      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700 dark:text-orange-300">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.03em] text-navy-900 dark:text-dark-text sm:text-[2.5rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-navy-500 dark:text-dark-muted sm:text-base">
              {description}
            </p>
          </div>

          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        {stats.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[28px] border border-cream-200/90 bg-white/78 p-4 shadow-soft backdrop-blur-sm dark:border-dark-border dark:bg-dark-card/75"
              >
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                {stat.hint && (
                  <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">{stat.hint}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
