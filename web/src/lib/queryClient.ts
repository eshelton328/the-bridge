// The app's one TanStack Query client: what a page entry or loader uses to
// read the server. Screens and blocks never import it (props-only). A
// query does not retry, so a server that is down shows at once.
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
