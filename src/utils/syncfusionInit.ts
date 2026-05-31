import { registerLicense } from "@syncfusion/ej2-base";

let registered = false;

export function ensureSyncfusionLicense(): void {
  if (!registered) {
    registerLicense(
      "Ngo9BigBOggjHTQxAR8/V1JHaF5cWWdCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdlWXtcd3VRRWlcWUF0XUpWYEo="
    );
    registered = true;
  }
}
