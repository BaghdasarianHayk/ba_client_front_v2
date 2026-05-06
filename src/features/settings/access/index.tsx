import { ContentSection } from '../components/content-section'
import { AccessPanel } from './access-panel'

export function SettingsAccess() {
  return (
    <ContentSection
      title='Access & Export'
      desc='Manage collaborators, export data, or delete this project.'
    >
      <AccessPanel />
    </ContentSection>
  )
}
