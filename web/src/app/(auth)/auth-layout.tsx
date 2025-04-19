// interface Props {
//   children: React.ReactNode
// }

// export default function AuthLayout({ children }: Props) {
//   return (
//     <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
//       <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
//         <div className='mb-4 flex items-center justify-center'>
//           <svg
//             xmlns='http://www.w3.org/2000/svg'
//             viewBox='0 0 24 24'
//             fill='none'
//             stroke='currentColor'
//             strokeWidth='2'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//             className='mr-2 h-6 w-6'
//           >
//             <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
//           </svg>
//           <h1 className='text-xl font-medium'>Shadcn Admin</h1>
//         </div>
//         {children}
//       </div>
//     </div>
//   )
// }

import AuthHeader from "@/components/auth/Header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <>
    //   <AuthHeader />
    //   <main className="pt-16">{children}</main>
    // </>
    <div className="container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[640px] lg:p-8">
        <div className="mb-4 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-xl font-medium">LaunchpadAI</span>
        </div>

        {children}
      </div>
    </div>
  );
}
