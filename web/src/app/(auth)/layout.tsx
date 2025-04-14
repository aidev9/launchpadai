import AuthHeader from '@/components/auth/Header'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AuthHeader />
      <main className="pt-16">{children}</main>
    </>
  )
}
