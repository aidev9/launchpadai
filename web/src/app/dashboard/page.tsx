import { Metadata } from 'next'
import SignOutButton from '@/components/SignOutButton'
import AuthDebugger from './components/AuthDebugger'

export const metadata: Metadata = {
  title: 'Dashboard | LaunchpadAI',
  description: 'Your LaunchpadAI Dashboard',
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <SignOutButton variant="outline" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to LaunchpadAI</h2>
        <p className="text-gray-600 mb-4">
          You have successfully signed in! This is your protected dashboard.
        </p>
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-blue-700">
            This page is protected by authentication middleware. If you can see
            this, your authentication is working correctly.
          </p>
        </div>

        <AuthDebugger />
      </div>
    </div>
  )
}
