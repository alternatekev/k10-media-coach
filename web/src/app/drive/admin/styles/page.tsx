import StyleDictionary from './StyleDictionary'

export const metadata = {
  title: 'Style Dictionary — RaceCor.io Pro Drive',
}

export default function StylesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-wide uppercase text-[var(--text)] mb-2">
        Style Dictionary
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Design tokens powering the K10 Motorsports platform — shared across the web app, overlay HUD, and marketing site.
      </p>
      <StyleDictionary />
    </div>
  )
}
