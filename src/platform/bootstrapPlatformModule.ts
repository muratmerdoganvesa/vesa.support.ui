import { isPlatformModuleMode } from './platformMode';
import { applyPlatformContext, onLuigiInit } from '../luigi';

/** React render öncesi — Luigi context ve token'ı mümkün olan en erken aşamada al */
export function bootstrapPlatformModule(): void {
  if (!isPlatformModuleMode()) return;

  onLuigiInit((context) => {
    applyPlatformContext(context);
  });
}
