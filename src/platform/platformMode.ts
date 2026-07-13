/** WorkZone shell iframe içinde modül olarak çalışıyor mu */
export function isPlatformModuleMode(): boolean {
  return window.self !== window.top;
}

export const PLATFORM_ROUTE_PREFIX = '/support';
