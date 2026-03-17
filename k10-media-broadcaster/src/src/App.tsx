import { SettingsProvider, useSettings } from '@hooks/useSettings'
import { TelemetryProvider } from '@hooks/useTelemetry'
import Dashboard from '@components/layout/Dashboard'
import { WebGLProvider } from '@components/layout/WebGLProvider'

function AppContent() {
  const { settings } = useSettings()
  return (
    <WebGLProvider>
      <TelemetryProvider settings={settings}>
        <Dashboard />
      </TelemetryProvider>
    </WebGLProvider>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  )
}
