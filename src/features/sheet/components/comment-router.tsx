type CommentRouterProps = {
  className?: string
}

export function CommentRouter({ className }: CommentRouterProps) {
  return (
    <svg
      width='12'
      height='16'
      viewBox='0 0 12 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path d='M7.5 8L12 8' stroke='currentColor' />
      <path
        d='M0 0C-8.61039e-08 0.984914 0.194379 1.96018 0.571289 2.87012C0.948198 3.78001 1.49988 4.6073 2.19629 5.30371C2.8927 6.00012 3.71999 6.5518 4.62988 6.92871C5.53982 7.30562 6.51509 7.5 7.5 7.5V8.5C6.38376 8.5 5.27834 8.2797 4.24707 7.85254C3.2159 7.42538 2.27849 6.79997 1.48926 6.01074C0.894785 5.41627 0.393868 4.7374 0 3.99805V0Z'
        fill='currentColor'
      />
    </svg>
  )
}
