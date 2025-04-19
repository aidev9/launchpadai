import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import NProgress from "nprogress";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [prevSearch, setPrevSearch] = useState(searchParams.toString());

  useEffect(() => {
    const currentSearch = searchParams.toString();
    if (pathname !== prevPathname || currentSearch !== prevSearch) {
      NProgress.start();
      NProgress.done();
      setPrevPathname(pathname);
      setPrevSearch(currentSearch);
    }
  }, [pathname, searchParams, prevPathname, prevSearch]);

  return null;
}
