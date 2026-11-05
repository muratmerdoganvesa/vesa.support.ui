import { formatDateTime, formatHours } from "./shared";
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

const textOrDash = (value?: string | number | null): string => {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text ? escapeHtml(text) : "—";
};

const multilineHtml = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) return "<span class=\"muted\">—</span>";
  return escapeHtml(trimmed).replace(/\n/g, "<br>");
};

const stripHtmlToText = (value?: string | null): string => {
  if (!value?.trim()) return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

export const buildApprovedEffortHtml = (
  detail: TicketEffortManagementDetailDto,
  efforts: TicketEffortManagementEffortsDto | null
): string => {
  const ticketNo = detail.ticketNumber ?? "—";
  const items = efforts?.items ?? [];
  const canViewActualHours =
    detail.canViewActualHours !== false && efforts?.canViewActualHours !== false;
  const generatedAt = formatDateTime(new Date().toISOString());
  const descriptionText = stripHtmlToText(detail.description);

  const effortRows =
    items.length === 0
      ? `<tr>
          <td colspan="${canViewActualHours ? 4 : 3}" class="empty">Bu talebe bağlı efor kaydı yok.</td>
        </tr>`
      : items
          .map((item, index) => {
            const personCell = canViewActualHours
              ? `<td>
                  <div class="person-name">${textOrDash(item.userAppName)}</div>
                  ${item.userTitle ? `<div class="person-title">${escapeHtml(item.userTitle)}</div>` : ""}
                </td>`
              : "";
            return `<tr>
              <td class="num index">${index + 1}</td>
              ${personCell}
              <td class="num highlight">${escapeHtml(formatHours(item.invoiceHours))}</td>
              <td class="work">${multilineHtml(item.description)}</td>
              <td class="date">${escapeHtml(formatDateTime(item.createdDate))}</td>
            </tr>`;
          })
          .join("");

  const metaItems = [
    { label: "Müşteri", value: detail.customerName },
    { label: "Şirket", value: detail.workCompanyName },
    { label: "Departman", value: detail.departmentName },
    { label: "Departman yöneticisi", value: detail.departmentManagerName || detail.sentByUserName },
    { label: "Talep sahibi", value: detail.ticketOwnerName || detail.ticketCreatedBy },
    { label: "Öncelik", value: detail.priorityText },
    { label: "Tip", value: detail.typeText },
    { label: "Talep durumu", value: detail.ticketStatusText },
    { label: "Oluşturma", value: formatDateTime(detail.ticketCreatedDate) },
    { label: "Gönderen", value: detail.sentByUserName },
    { label: "Gönderim", value: formatDateTime(detail.sentAt) },
    {
      label: "Onaylayan",
      value: detail.customerApprovedByUserName
        ? `${detail.customerApprovedByUserName}${detail.customerApprovedAt ? ` · ${formatDateTime(detail.customerApprovedAt)}` : ""}`
        : null,
    },
  ]
    .map(
      (item) => `<div class="meta-item">
        <span class="meta-label">${escapeHtml(item.label)}</span>
        <span class="meta-value">${textOrDash(item.value)}</span>
      </div>`
    )
    .join("");

  const approvalNote = detail.returnNote?.trim()
    ? `<section class="card note-card">
        <h2>Onay açıklaması</h2>
        <p>${multilineHtml(detail.returnNote)}</p>
      </section>`
    : "";

  const descriptionBlock = descriptionText
    ? `<section class="card">
        <h2>Talep açıklaması</h2>
        <p class="body-text">${multilineHtml(descriptionText)}</p>
      </section>`
    : "";

  const summaryCards = `
    <div class="summary-grid">
      <div class="summary-card primary">
        <span class="summary-label">Toplam fatura saati</span>
        <strong class="summary-value">${escapeHtml(formatHours(efforts?.totalInvoiceHours))}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">Görev / iş kaydı</span>
        <strong class="summary-value">${items.length}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">Durum</span>
        <strong class="summary-value status">${textOrDash(detail.statusText || "Onaylandı")}</strong>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Talep No: ${escapeHtml(ticketNo)} — Onaylanan Efor</title>
  <style>
    :root {
      --brand: #3e5d8f;
      --brand-soft: #e8eef7;
      --ink: #0f172a;
      --muted: #64748b;
      --line: #e2e8f0;
      --paper: #ffffff;
      --canvas: #f5f7fb;
      --success: #059669;
      --success-soft: #ecfdf5;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: linear-gradient(180deg, #eef2f8 0%, var(--canvas) 220px, var(--canvas) 100%);
      color: var(--ink);
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      max-width: 920px;
      margin: 28px auto;
      padding: 0 16px 40px;
    }
    .sheet {
      background: var(--paper);
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 18px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    .hero {
      position: relative;
      padding: 28px 32px 24px;
      background:
        radial-gradient(circle at top right, rgba(62, 93, 143, 0.18), transparent 42%),
        linear-gradient(135deg, #314f7c 0%, var(--brand) 48%, #5272a8 100%);
      color: #fff;
    }
    .hero-kicker {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      opacity: 0.82;
    }
    .hero h1 {
      margin: 8px 0 6px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .hero-title {
      margin: 0;
      max-width: 720px;
      font-size: 15px;
      opacity: 0.92;
    }
    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 18px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-size: 12px;
      font-weight: 600;
    }
    .content { padding: 24px 28px 30px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .summary-card {
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #f8fafc;
    }
    .summary-card.primary {
      background: var(--brand-soft);
      border-color: #c9d7ea;
    }
    .summary-card.success {
      background: var(--success-soft);
      border-color: #a7f3d0;
    }
    .summary-label {
      display: block;
      margin-bottom: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .summary-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--ink);
      letter-spacing: -0.02em;
    }
    .summary-value.status {
      font-size: 15px;
      color: var(--success);
    }
    .card {
      margin-top: 16px;
      padding: 18px 18px 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
    }
    .card h2 {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .body-text {
      margin: 0;
      color: #334155;
      font-size: 14px;
      white-space: pre-wrap;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px 16px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 12px;
      border-radius: 12px;
      background: #f8fafc;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .meta-value {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      word-break: break-word;
    }
    .note-card {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .note-card p {
      margin: 0;
      color: #065f46;
      font-size: 14px;
    }
    .table-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 640px;
    }
    th {
      padding: 11px 12px;
      background: #f1f5f9;
      border-bottom: 1px solid var(--line);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
      text-align: left;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eef2f7;
      font-size: 13px;
      color: #334155;
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    td.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
    td.index { width: 44px; color: #94a3b8; font-weight: 600; }
    td.highlight { font-weight: 700; color: var(--brand); }
    td.work { min-width: 220px; line-height: 1.55; }
    td.date { white-space: nowrap; color: #64748b; }
    td.empty {
      text-align: center;
      color: #94a3b8;
      padding: 28px 12px;
    }
    .person-name { font-weight: 600; color: #0f172a; }
    .person-title { margin-top: 2px; font-size: 11px; color: #94a3b8; }
    .muted { color: #94a3b8; }
    .footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px dashed var(--line);
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { background: #fff; }
      .page { margin: 0; max-width: none; padding: 0; }
      .sheet { border: none; border-radius: 0; box-shadow: none; }
      .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <article class="sheet">
      <header class="hero">
        <p class="hero-kicker">Vesacons Destek · Onaylanan Efor Raporu</p>
        <h1>Talep No: ${escapeHtml(ticketNo)}</h1>
        <p class="hero-title">${textOrDash(detail.title)}</p>
        <div class="hero-meta">
          <span class="chip">Durum: ${textOrDash(detail.statusText || "Onaylandı")}</span>
          <span class="chip">Fatura: ${escapeHtml(formatHours(efforts?.totalInvoiceHours))} saat</span>
          ${detail.customerName ? `<span class="chip">${escapeHtml(detail.customerName)}</span>` : ""}
        </div>
      </header>

      <div class="content">
        ${summaryCards}

        <section class="card">
          <h2>Talep detayları</h2>
          <div class="meta-grid">
            ${metaItems}
          </div>
        </section>

        ${descriptionBlock}
        ${approvalNote}

        <section class="card">
          <h2>Yapılacak işler ve fatura saatleri</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  ${canViewActualHours ? "<th>Personel</th>" : ""}
                  <th>Fatura saati</th>
                  <th>Yapılacak iş / görev</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                ${effortRows}
              </tbody>
            </table>
          </div>
        </section>

        <footer class="footer">
          <span>Bu belge onaylanan efor kaydının özetidir.</span>
          <span>Oluşturulma: ${escapeHtml(generatedAt)}</span>
        </footer>
      </div>
    </article>
  </div>
</body>
</html>`;
};

export const downloadApprovedEffortHtml = (
  detail: TicketEffortManagementDetailDto,
  efforts: TicketEffortManagementEffortsDto | null
): void => {
  const ticketNo = detail.ticketNumber;
  if (ticketNo === null || ticketNo === undefined) {
    throw new Error("Talep numarası bulunamadı.");
  }

  const html = buildApprovedEffortHtml(detail, efforts);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Ticket No : ${ticketNo}.html`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
