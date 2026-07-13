import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Router,
  createPath,
  parsePath,
  type Location,
  type Navigator,
  type To,
} from 'react-router-dom';
import { PLATFORM_ROUTE_PREFIX } from './platformMode';

/** WorkZone shell rotalarını uygulama içi rotalara eşle */
const ROUTE_ALIASES: Record<string, string> = {
  '/my-tickets': '/solveAllTicket/',
  '/my-tickets/': '/solveAllTicket/',
};

function normalizeAlias(pathname: string): string {
  return ROUTE_ALIASES[pathname] ?? pathname;
}

function toInternalLocation(hashPath: string): Location {
  const raw = hashPath.startsWith('#') ? hashPath.slice(1) : hashPath;
  const parsed = parsePath(raw || PLATFORM_ROUTE_PREFIX);
  let pathname = parsed.pathname || '/';

  if (pathname.startsWith(PLATFORM_ROUTE_PREFIX)) {
    pathname = pathname.slice(PLATFORM_ROUTE_PREFIX.length) || '/';
  }

  pathname = normalizeAlias(pathname);
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  return {
    pathname,
    search: parsed.search ?? '',
    hash: parsed.hash ?? '',
    state: null,
    key: 'default',
  };
}

function toExternalPath(to: To): string {
  const path = typeof to === 'string' ? to : createPath(to);
  const parsed = parsePath(path);
  let pathname = parsed.pathname || '/';

  if (!pathname.startsWith(PLATFORM_ROUTE_PREFIX)) {
    pathname =
      pathname === '/'
        ? `${PLATFORM_ROUTE_PREFIX}/my-tickets`
        : `${PLATFORM_ROUTE_PREFIX}${pathname}`;
  }

  return createPath({ ...parsed, pathname });
}

/**
 * WorkZone iframe hash rotalarını (#/support/...) uygulama içi rotalara çevirir.
 * Mevcut route tanımları değiştirilmeden çalışır.
 */
export function PlatformHashRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(() =>
    toInternalLocation(window.location.hash || `#${PLATFORM_ROUTE_PREFIX}/my-tickets`),
  );

  useEffect(() => {
    const onHashChange = () => {
      setLocation(toInternalLocation(window.location.hash));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigator = useMemo<Navigator>(
    () => ({
      createHref(to) {
        return `#${toExternalPath(to)}`;
      },
      push(to) {
        window.location.hash = toExternalPath(to);
      },
      replace(to) {
        const external = toExternalPath(to);
        const nextHash = external.startsWith('#') ? external : `#${external}`;
        if (window.location.hash !== nextHash) {
          window.history.replaceState(null, '', nextHash);
          setLocation(toInternalLocation(nextHash));
        }
      },
      go(delta) {
        window.history.go(delta);
      },
    }),
    [],
  );

  return (
    <Router location={location} navigator={navigator}>
      {children}
    </Router>
  );
}
