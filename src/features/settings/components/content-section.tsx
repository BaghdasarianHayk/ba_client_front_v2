type ContentSectionProps = {
  title?: string
  desc?: string
  children: React.JSX.Element
}

export function ContentSection({ children }: ContentSectionProps) {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='w-full pe-4'>
        <div className='-mx-1 px-1.5 lg:max-w-xl'>{children}</div>
      </div>
    </div>
  )
}
