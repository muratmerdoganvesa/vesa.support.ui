import { formatHours, formatManDays } from "./shared";
import type {
  TicketEffortManagementDetailDto,
  TicketEffortManagementEffortsDto,
} from "./types";

const escapeHtml = (value?: string | number | null): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const multilineHtml = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) return "—";
  return escapeHtml(trimmed).replace(/\n/g, "<br>");
};

const buildEffortRowsPlain = (efforts: TicketEffortManagementEffortsDto | null): string => {
  const items = efforts?.items ?? [];
  if (items.length === 0) {
    return "Bu talebe bağlı efor kaydı yok.";
  }

  return items
    .map((item, index) => {
      const description = item.description?.trim() || "—";
      const invoiceHours = formatHours(item.invoiceHours);
      const manDays = formatManDays(item.invoiceHours);
      return [
        `${index + 1}. Açıklama: ${description}`,
        `   Fatura saati: ${invoiceHours}`,
        `   Adam gün: ${manDays}`,
      ].join("\n");
    })
    .join("\n\n");
};

export const buildExternalEffortMailPlainText = (
  detail: TicketEffortManagementDetailDto,
  efforts: TicketEffortManagementEffortsDto | null
): string => {
  const ticketNo = detail.ticketNumber ?? "—";
  const totalInvoiceHours = formatHours(efforts?.totalInvoiceHours);
  const totalManDays = formatManDays(efforts?.totalInvoiceHours);
  const effortBlock = buildEffortRowsPlain(efforts);

  return [
    "Merhaba                     ,",
    "",
    `${ticketNo} Nolu Talebiniz kapsamında toplam eforumuz ${totalManDays} adam/gün olup onayınızla çalışmayı plana alabiliriz. Bilginize sunar onayınızı rica ederim`,
    "",
    `Ticket Numarası : ${ticketNo}`,
    "",
    "Taleple ilgili:",
    effortBlock,
    "",
    `Toplam fatura saati : ${totalInvoiceHours}`,
    `Toplam adam gün : ${totalManDays}`,
    "",
    "İyi çalışmalar dilerim",
  ].join("\n");
};

export const buildExternalEffortMailHtml = (
  detail: TicketEffortManagementDetailDto,
  efforts: TicketEffortManagementEffortsDto | null
): string => {
  const ticketNo = escapeHtml(detail.ticketNumber ?? "—");
  const totalInvoiceHours = escapeHtml(formatHours(efforts?.totalInvoiceHours));
  const totalManDays = escapeHtml(formatManDays(efforts?.totalInvoiceHours));
  const items = efforts?.items ?? [];

  const rows =
    items.length === 0
      ? `<tr>
          <td colspan="3" style="padding:10px 12px;font-size:13px;color:#64748b;text-align:center;">
            Bu talebe bağlı efor kaydı yok.
          </td>
        </tr>`
      : items
          .map((item) => {
            return `<tr>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:13px;line-height:1.5;vertical-align:top;">
                ${multilineHtml(item.description)}
              </td>
              <td align="right" style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:13px;white-space:nowrap;vertical-align:top;">
                ${escapeHtml(formatHours(item.invoiceHours))}
              </td>
              <td align="right" style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:13px;font-weight:700;white-space:nowrap;vertical-align:top;">
                ${escapeHtml(formatManDays(item.invoiceHours))}
              </td>
            </tr>`;
          })
          .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;line-height:1.6;">
  <p style="margin:0 0 16px;">Merhaba&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;,</p>
  <p style="margin:0 0 16px;">
    <strong>${ticketNo}</strong> Nolu Talebiniz kapsamında toplam eforumuz <strong>${totalManDays}</strong> adam/gün olup onayınızla çalışmayı plana alabiliriz. Bilginize sunar onayınızı rica ederim
  </p>
  <p style="margin:0 0 16px;">Ticket Numarası : <strong>${ticketNo}</strong></p>
  <p style="margin:0 0 8px;"><strong>Taleple ilgili</strong></p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
         style="border-collapse:collapse;width:100%;max-width:720px;margin:0 0 16px;border:1px solid #e2e8f0;">
    <tr>
      <th align="left" style="background-color:#f8fafc;padding:10px 12px;font-size:12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">
        Açıklama
      </th>
      <th align="right" style="background-color:#f8fafc;padding:10px 12px;font-size:12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;white-space:nowrap;">
        Fatura saati
      </th>
      <th align="right" style="background-color:#f8fafc;padding:10px 12px;font-size:12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;white-space:nowrap;">
        Adam gün
      </th>
    </tr>
    ${rows}
  </table>
  <p style="margin:0 0 4px;">Toplam fatura saati : <strong>${totalInvoiceHours}</strong></p>
  <p style="margin:0 0 16px;">Toplam adam gün : <strong>${totalManDays}</strong></p>
  <p style="margin:0;">İyi çalışmalar dilerim</p>
</body>
</html>`;
};

const copyHtmlToClipboard = async (html: string, plainText: string): Promise<boolean> => {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return true;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

/**
 * Efor mail şablonunu panoya kopyalar. Outlook açmaz, status değiştirmez.
 */
export const openExternalEffortMailInOutlook = async (
  detail: TicketEffortManagementDetailDto,
  efforts: TicketEffortManagementEffortsDto | null
): Promise<string> => {
  if (detail.ticketNumber === null || detail.ticketNumber === undefined) {
    throw new Error("Talep numarası bulunamadı.");
  }

  const html = buildExternalEffortMailHtml(detail, efforts);
  const plainText = buildExternalEffortMailPlainText(detail, efforts);
  const copied = await copyHtmlToClipboard(html, plainText);

  if (!copied) {
    throw new Error("Şablon panoya kopyalanamadı. Tarayıcı pano iznini kontrol edin.");
  }

  return "Efor şablonu panoya kopyalandı. Mail gövdesine Ctrl+V ile yapıştırabilirsiniz.";
};
