import ComponentCatalog from './ComponentCatalog'

export const metadata = {
  title: 'Components — RaceCor.io Pro Drive',
}

export default function ComponentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-wide uppercase text-[var(--text)] mb-2">
        Component Catalog
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Inventory of UI components across the web dashboard and broadcast overlay.
      </p>
      <ComponentCatalog />
    </div>
  )
}
