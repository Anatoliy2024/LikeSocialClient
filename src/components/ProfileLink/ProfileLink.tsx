import Link from "next/link"

type Props = {
  userId: string
  currentUserId: string | null
  children: React.ReactNode
  className?: string
}

export const ProfileLink = ({
  userId,
  currentUserId,
  children,
  className,
}: Props) => {
  if (currentUserId === null) return
  const isMe = currentUserId === userId
  const href = isMe ? "/profile" : `/profile/${userId}`

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
