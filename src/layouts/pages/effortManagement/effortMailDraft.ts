import { formatHours } from "./shared";
import type {
  TicketEffortManagementDetailDto,
  TicketEffortManagementEffortsDto,
} from "./types";
import { VESA_MAIL_COLOR_IMG, VESA_MAIL_LOGO } from "./vesaMailBrand";

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
  if (!trimmed) return "<span style=\"color:#94a3b8;\">—</span>";
  return escapeHtml(trimmed).replace(/\n/g, "<br>");
};

export const buildExternalEffortMailSubject = (ticketNumber?: number | null): string =>
  `Talep ${ticketNumber ?? "—"} Numaralı Ticketin Efor Onayı Bilgisi`;

export const buildExternalEffortMailHtml = (
  recipientName: string,
  detail: TicketEffortManagementDetailDto,
  efforts: TicketEffortManagementEffortsDto | null
): string => {
  const name = escapeHtml(recipientName.trim() || "Yetkili");
  const ticketNo = escapeHtml(detail.ticketNumber ?? "—");
  const title = escapeHtml(detail.title?.trim() || "—");
  const customer = escapeHtml(detail.customerName?.trim() || "—");
  const items = efforts?.items ?? [];
  const totalInvoice = formatHours(efforts?.totalInvoiceHours);
  const mailTitle = "Efor Onayı Bilgisi";

  const rows =
    items.length === 0
      ? `<tr>
          <td colspan="2" style="padding:18px 14px;font-size:13px;color:#94a3b8;text-align:center;">
            Bu talebe bağlı efor kaydı yok.
          </td>
        </tr>`
      : items
          .map((item, index) => {
            const zebra = index % 2 === 1 ? "background-color:#f8fafc;" : "background-color:#ffffff;";
            return `<tr>
              <td style="padding:12px 14px;border-bottom:1px solid #eef2f7;color:#334155;font-size:13px;line-height:1.55;${zebra}">
                ${multilineHtml(item.description)}
              </td>
              <td align="right" style="padding:12px 14px;border-bottom:1px solid #eef2f7;color:#3e5d8f;font-size:13px;font-weight:700;white-space:nowrap;width:22%;${zebra}">
                ${escapeHtml(formatHours(item.invoiceHours))}
              </td>
            </tr>`;
          })
          .join("");

  const content = `
                            <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
                                Merhaba <strong>${name}</strong>,
                            </p>
                            <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
                                Ticket No : <strong style="color:#0f172a;">${ticketNo}</strong> talebiniz efor bilgisi aşağıda ki gibidir.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                   style="border-collapse:separate;border-spacing:0;margin:0 0 22px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                                <tr>
                                    <td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;width:50%;vertical-align:top;">
                                        <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;color:#94a3b8;">Başlık</p>
                                        <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.5;word-break:break-word;overflow-wrap:anywhere;">${title}</p>
                                    </td>
                                    <td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;border-left:1px solid #f1f5f9;width:50%;vertical-align:top;">
                                        <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;color:#94a3b8;">Müşteri</p>
                                        <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.5;word-break:break-word;overflow-wrap:anywhere;">${customer}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 18px;background-color:#f8fafc;width:50%;vertical-align:top;">
                                        <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;color:#94a3b8;">Ticket No</p>
                                        <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">#${ticketNo}</p>
                                    </td>
                                    <td style="padding:14px 18px;background-color:#f8fafc;border-left:1px solid #f1f5f9;width:50%;vertical-align:top;">
                                        <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;color:#94a3b8;">Toplam fatura saati</p>
                                        <p style="margin:0;font-size:18px;font-weight:700;color:#3e5d8f;">${escapeHtml(totalInvoice)}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;color:#64748b;">
                                Yapılacak işler
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                   style="border-collapse:separate;border-spacing:0;table-layout:fixed;width:100%;margin:0 0 22px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                                <tr>
                                    <th align="left" style="background-color:#f1f5f9;padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0;width:78%;">
                                        Yapılacak iş
                                    </th>
                                    <th align="right" style="background-color:#f1f5f9;padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0;width:22%;">
                                        Fatura saati
                                    </th>
                                </tr>
                                ${rows}
                            </table>

                            <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#475569;">İyi çalışmalar dileriz.</p>`;

  // Diğer sistem mail şablonlarıyla aynı kabuk: logo + color img
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(mailTitle)}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f7fc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f7fc;padding:20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="800" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.08);overflow:hidden;">
                    <tr>
                        <td style="background-color:#ffffff;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                                <tr>
                                    <td align="left" style="width:212px;padding:14px 12px 14px 20px;vertical-align:middle;">
                                        <img src="${VESA_MAIL_LOGO}" alt="Vesacons" width="180" height="37" style="display:block;width:180px;height:37px;border:0;outline:none;text-decoration:none;">
                                    </td>
                                    <td style="background-color:#ffffff;padding:12px;width:auto;">
                                        <img src="${VESA_MAIL_COLOR_IMG}" alt="Logo" width="650" height="20" style="display:block;width:100%;height:auto;border:0;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 28px 28px;">
                            <h2 style="margin:0 0 18px;font-size:20px;font-weight:700;color:#0f172a;">${escapeHtml(mailTitle)}</h2>
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f4f7fc;padding:15px;text-align:center;font-size:12px;color:#64748b;">
                            Bu e-posta Vesacons Destek üzerinden oluşturulmuştur.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const copyHtmlToClipboard = async (html: string): Promise<boolean> => {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob(
            ["Efor onayı bilgisi (HTML içerik panoya kopyalandı)."],
            { type: "text/plain" }
          ),
        }),
      ]);
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

const openOutlookCompose = (to: string, subject: string): void => {
  // URLSearchParams kullanma: boşlukları + yapar ve Outlook'ta "Talep+849..." görünür.
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}`;
  const anchor = document.createElement("a");
  anchor.href = mailtoUrl;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

/**
 * Dosya indirmeden Outlook açar (yalnızca alıcı + konu).
 * Kurumsal HTML gövde panoya kopyalanır; gövdeye Ctrl+V ile yapıştırılır.
 */
export const openExternalEffortMailInOutlook = async (
  recipientEmail: string,
  recipientName: string,
  detail: TicketEffortManagementDetailDto,
  efforts: TicketEffortManagementEffortsDto | null
): Promise<string> => {
  const to = recipientEmail.trim();
  if (!to) {
    throw new Error("Alıcı e-posta adresi zorunludur.");
  }
  if (detail.ticketNumber === null || detail.ticketNumber === undefined) {
    throw new Error("Talep numarası bulunamadı.");
  }

  const subject = buildExternalEffortMailSubject(detail.ticketNumber);
  const html = buildExternalEffortMailHtml(recipientName, detail, efforts);
  const copied = await copyHtmlToClipboard(html);

  openOutlookCompose(to, subject);

  return copied
    ? "Outlook açıldı. Mail gövdesine tıklayıp Ctrl+V ile şablonu yapıştırın."
    : "Outlook açıldı ancak içerik panoya kopyalanamadı. Tarayıcı pano iznini kontrol edin.";
};
