import { ContentSection } from '../components/content-section'
import { CommentsForm } from './comments-form'

export function SettingsComments() {
  return (
    <ContentSection
      title='Comments Preview'
      desc='Control how comments are displayed on each mention.'
    >
      <CommentsForm />
    </ContentSection>
  )
}
