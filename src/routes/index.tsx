import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-cyan-400">Blue Lagune</h1>
      <p className="mt-4 max-w-md text-slate-300">
        Chemietoiletten-Entsorgungsstationen für Wohnmobile in Deutschland.
      </p>
      <p className="mt-6 text-sm text-slate-500">
        Vollständiger Code wird schrittweise aus dem Workspace hochgeladen.
      </p>
    </div>
  )
}
