- Never use IDs to route users, instead always set the atom in the parent and load it from the state in the child page. Never make DB fetch in children pages. Example parent page: /admin/courses. Example child page: /admin/courses/course
- Always use Tanstac Query whenever possible for mutations and queries
- Never use APIs, instead use React Server Actions
- Always create Tanstack tables with headers, filters and pagination
- Never start a server like pnpm run dev
