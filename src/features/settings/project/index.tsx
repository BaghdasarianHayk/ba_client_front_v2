import { ContentSection } from '../components/content-section'
import { ProjectForm } from './project-form'

export function SettingsProject() {
  return (
    <ContentSection
      title='Project'
      desc='Manage your brand details. The description helps AI suggest relevant keywords.'
    >
      <ProjectForm />
    </ContentSection>
  )
}
