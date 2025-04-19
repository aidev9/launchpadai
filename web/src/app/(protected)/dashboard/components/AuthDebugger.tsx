import { cookies } from 'next/headers'

export default async function AuthDebugger() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  return (
    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mt-4">
      <h3 className="font-semibold text-yellow-800 mb-2">
        Auth Debugger (Server Component)
      </h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p>
          Session Cookie Present:{' '}
          <span className="font-mono">{sessionCookie ? 'Yes' : 'No'}</span>
        </p>
        {sessionCookie && (
          <>
            <p>
              Cookie Name:{' '}
              <span className="font-mono">{sessionCookie.name}</span>
            </p>
            <p>
              Cookie Value Length:{' '}
              <span className="font-mono">
                {sessionCookie.value.length} chars
              </span>
            </p>
          </>
        )}
        <p>
          All Cookies:{' '}
          <span className="font-mono">
            [
            {cookieStore
              .getAll()
              .map((c) => c.name)
              .join(', ')}
            ]
          </span>
        </p>
      </div>
    </div>
  )
}
