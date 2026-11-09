import vesaconsLogoSvg from "assets/images/small-logos/vesacons-logo.svg?raw";
import { formatDateTime, formatHours, formatManDays } from "./shared";
import {
  TicketEffortStatus,
  type TicketEffortManagementDetailDto,
  type TicketEffortManagementEffortsDto,
} from "./types";

const VESACONS_LOGO_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(vesaconsLogoSvg)}`;

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
  const isApproved = detail.status === TicketEffortStatus.CustomerApproved;
  const statusLabel = detail.statusText?.trim() || (isApproved ? "Onaylandı" : "—");
  const reportTitle = isApproved ? "Onaylanan Efor Raporu" : "Efor Raporu";
  const footerNote = isApproved
    ? "Bu belge onaylanan efor kaydının özetidir."
    : "Bu belge efor kaydının güncel özetidir.";
  const statusCardClass = isApproved ? "summary-card success" : "summary-card";

  const emptyColSpan = canViewActualHours ? 6 : 4;
  const effortRows =
    items.length === 0
      ? `<tr>
          <td colspan="${emptyColSpan}" class="empty">Bu talebe bağlı efor kaydı yok.</td>
        </tr>`
      : items
          .map((item, index) => {
            const personCell = canViewActualHours
              ? `<td class="person">
                  <div class="person-name">${textOrDash(item.userAppName)}</div>
                  ${item.userTitle ? `<div class="person-title">${escapeHtml(item.userTitle)}</div>` : ""}
                </td>`
              : "";
            const invoiceCell = canViewActualHours
              ? `<td class="num">${escapeHtml(formatHours(item.invoiceHours))}</td>`
              : "";
            return `<tr>
              <td class="num index">${index + 1}</td>
              ${personCell}
              ${invoiceCell}
              <td class="num highlight">${escapeHtml(formatManDays(item.invoiceHours))}</td>
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

  const approvalNote =
    isApproved && detail.returnNote?.trim()
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
      ${
        canViewActualHours
          ? `<div class="summary-card">
        <span class="summary-label">Toplam fatura saati</span>
        <strong class="summary-value">${escapeHtml(formatHours(efforts?.totalInvoiceHours))}</strong>
      </div>`
          : ""
      }
      <div class="summary-card primary">
        <span class="summary-label">Toplam adam gün</span>
        <strong class="summary-value">${escapeHtml(formatManDays(efforts?.totalInvoiceHours))}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">Görev / iş kaydı</span>
        <strong class="summary-value">${items.length}</strong>
      </div>
      <div class="${statusCardClass}">
        <span class="summary-label">Durum</span>
        <strong class="summary-value status">${textOrDash(statusLabel)}</strong>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Talep No: ${escapeHtml(ticketNo)} — ${escapeHtml(reportTitle)}</title>
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
    .hero-top {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .hero-logo-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 12px;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
    }
    .hero-logo {
      display: block;
      height: 28px;
      width: auto;
      max-width: 150px;
      object-fit: contain;
    }
    .hero-heading {
      min-width: 0;
      flex: 1;
    }
    .hero-report {
      margin: 0 0 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0.82;
    }
    .hero h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .hero-title {
      margin: 10px 0 0;
      max-width: 720px;
      font-size: 15px;
      opacity: 0.92;
      overflow-wrap: anywhere;
      word-break: break-word;
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
      overflow-wrap: anywhere;
      word-break: break-word;
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
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid var(--line);
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
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
    td.person { width: 160px; }
    td.highlight { width: 96px; font-weight: 700; color: var(--brand); }
    td.work {
      line-height: 1.55;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    td.date { width: 140px; white-space: nowrap; color: #64748b; }
    td.empty {
      text-align: center;
      color: #94a3b8;
      padding: 28px 12px;
    }
    .person-name {
      font-weight: 600;
      color: #0f172a;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .person-title {
      margin-top: 2px;
      font-size: 11px;
      color: #94a3b8;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
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
    @media (max-width: 720px) {
      .page { margin: 12px auto; padding: 0 10px 24px; }
      .hero { padding: 20px 16px 18px; }
      .hero h1 { font-size: 22px; }
      .hero-logo { height: 24px; max-width: 120px; }
      .content { padding: 16px 14px 20px; }
      .card { padding: 14px 12px; }
      table { min-width: 520px; }
      td.date { width: 120px; }
      td.highlight { width: 84px; }
    }
    @media print {
      body { background: #fff; }
      .page { margin: 0; max-width: none; padding: 0; }
      .sheet { border: none; border-radius: 0; box-shadow: none; }
      .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table { min-width: 0; }
      td.work { overflow-wrap: anywhere; word-break: break-word; }
    }
  </style>
</head>
<body>
  <div class="page">
    <article class="sheet">
      <header class="hero">
        <div class="hero-top">
          <div class="hero-logo-wrap">
            <img class="hero-logo" src="${VESACONS_LOGO_DATA_URI}" alt="Vesacons" />
          </div>
          <div class="hero-heading">
            <p class="hero-report">${escapeHtml(reportTitle)}</p>
            <h1>Talep No: ${escapeHtml(ticketNo)}</h1>
          </div>
        </div>
        <p class="hero-title">${textOrDash(detail.title)}</p>
        <div class="hero-meta">
          <span class="chip">Durum: ${textOrDash(statusLabel)}</span>
          <span class="chip">Adam gün: ${escapeHtml(formatManDays(efforts?.totalInvoiceHours))}</span>
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
          <h2>Yapılacak işler ve adam gün</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  ${canViewActualHours ? "<th>Personel</th>" : ""}
                  ${canViewActualHours ? "<th>Fatura saati</th>" : ""}
                  <th>Adam gün</th>
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
          <span>${escapeHtml(footerNote)}</span>
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
