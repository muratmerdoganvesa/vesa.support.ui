export const normalizeSicilNo = (value: string | null | undefined): string | null => {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (!digits) return null;
  return digits.padStart(8, "0");
};
