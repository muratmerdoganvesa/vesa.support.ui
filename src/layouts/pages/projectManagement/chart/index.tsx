import { useRef, useEffect, useState, useMemo } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { ensureSyncfusionLicense } from "utils/syncfusionInit";
import {
  GanttComponent,
  ColumnDirective,
  ColumnsDirective,
  Edit,
  ExcelExport,
  Filter,
  Inject,
  PdfExport,
  Reorder,
  Resize,
  Selection,
  Sort,
  TaskFieldsModel,
  Toolbar,
  DayMarkers,
  EditSettingsModel,
  PdfExportProperties,
  ColumnMenu,
  RowDD,
  ContextMenu,
  ContextMenuItem,
  LabelSettingsModel,
  EditDialogFieldsDirective,
  EditDialogFieldDirective,
  ResourceFieldsModel,
  EditDialogFieldSettingsModel,
  DialogFieldType,
  AddDialogFieldSettingsModel,
  AddDialogFieldsDirective,
  AddDialogFieldDirective,
} from "@syncfusion/ej2-react-gantt";
import { PdfFontStyle, PdfTrueTypeFont } from "@syncfusion/ej2-pdf-export";
import { MultiSelect } from "@syncfusion/ej2-dropdowns";
import { L10n } from "@syncfusion/ej2-base";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-calendars/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-lists/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-splitbuttons/styles/material.css";
import "@syncfusion/ej2-layouts/styles/material.css";
import "@syncfusion/ej2-grids/styles/material.css";
import "@syncfusion/ej2-treegrid/styles/material.css";
import "@syncfusion/ej2-react-gantt/styles/material.css";

ensureSyncfusionLicense();
import { ArrowLeft, ChevronRight, MessageSquare, FolderKanban, Users } from "lucide-react";
import { cn } from "lib/utils";
import ProjectStatsPanel from "../projectDashboard/components/ProjectStatsPanel";
import { buildProjectGanttStats } from "../projectDashboard/utils/buildGanttWorkload";
import PersonnelStatsView from "./PersonnelStatsView";
import { Card as ShadcnCard } from "components/ui/card";
import { Button } from "components/ui/button";
import {
  Dialog as ShadcnDialog,
  DialogContent as ShadcnDialogContent,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
  DialogFooter as ShadcnDialogFooter,
} from "components/ui/dialog";
import {
  Select as ShadcnSelect,
  SelectTrigger as ShadcnSelectTrigger,
  SelectValue as ShadcnSelectValue,
  SelectContent as ShadcnSelectContent,
  SelectItem as ShadcnSelectItem,
} from "components/ui/select";
import { Switch as ShadcnSwitch } from "components/ui/switch";
import {
  Tooltip as ShadcnTooltip,
  TooltipProvider as ShadcnTooltipProvider,
  TooltipTrigger as ShadcnTooltipTrigger,
  TooltipContent as ShadcnTooltipContent,
} from "components/ui/tooltip";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";

import getConfiguration from "confiuration";
import {
  ModuleApi,
  ProjectTasksApi,
  ProjectTasksInsertDto,
  ProjectTasksUpdateDto,
  ProjectTypes,
  UserAppDtoOnlyNameId,
  WorkCompanyDto,
} from "api/generated";
import {
  getProjectStatusLabel,
  getProjectTypeColumnColors,
  projectTypeOptions,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { font, photoBase64 } from "./font";
import { ExcelExportProperties } from "@syncfusion/ej2-grids";
import "./styles.css";

/** Syncfusion Gantt diyalog / buton metinleri (locale=en-US üzerine TR) */
L10n.load({
  "en-US": {
    gantt: {
      generalTab: "Genel",
      customTab: "Özel",
      writeNotes: "Not yazın",
      addDialogTitle: "Yeni Görev",
      editDialogTitle: "Görev Bilgisi",
      saveButton: "Kaydet",
      cancel: "İptal",
      delete: "Sil",
      add: "Ekle",
      edit: "Düzenle",
      update: "Güncelle",
      resourceName: "Kaynaklar",
      dependency: "Bağımlılık",
      notes: "Notlar",
      days: "gün",
      day: "gün",
    },
  },
});

/** Genel sekmede gösterilecek alanlar — TaskID bilinçli olarak hariç */
const GANTT_GENERAL_DIALOG_FIELDS = [
  "TaskName",
  "StartDate",
  "Duration",
  "EndDate",
  "Progress",
];

// force css ile rich text editori gizleme
const customStyles = `
  .e-rte-hidden{
    display: none;
  }
`;

/**
 * Syncfusion "Add" string'i getDefaultItems ile eşleşir ve alt menüyü ezdiği için,
 * görünürde aynı Add menüsü için sonuna zero-width karakter eklenir (kütüphane eşleştirmesini atlar).
 * Alt menüde "Child" metni korunur; id ChildPopup olur — böylece tek görev addRecord tetiklenmez, popup kullanılır.
 */
const GANTT_ADD_MENU_LABEL = "Add\u200B";
const GANTT_CHILD_POPUP_MENU_KEY = "ChildPopup";
const GANTT_INSTANCE_ID = "projectGanttChart";

/** Yeni görevlerde varsayılan başlangıç tarihi olarak bugünün tarihi (saat 00:00). */
const getTodayForGantt = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatLocalDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Syncfusion add dialog ve batch child oluşturma için StartDate/EndDate varsayılanlarını bugüne ayarlar. */
const applyTodayAsDefaultTaskDates = (rowData: any) => {
  if (!rowData) return;
  const today = getTodayForGantt();
  const end = new Date(today);
  end.setDate(end.getDate() + 1);

  rowData.StartDate = today;
  rowData.EndDate = end;
  if (rowData.ganttProperties) {
    rowData.ganttProperties.startDate = new Date(today);
    rowData.ganttProperties.endDate = new Date(end);
  }
  if (rowData.taskData) {
    rowData.taskData.StartDate = today;
    rowData.taskData.EndDate = end;
  }
};

function buildAddMenuWithChildPopup(ganttId: string) {
  const target = ".e-content";
  return {
    text: GANTT_ADD_MENU_LABEL,
    id: `${ganttId}_contextMenu_AddMenu`,
    target,
    iconCss: "e-icons e-add",
    items: [
      {
        text: "Above",
        id: `${ganttId}_contextMenu_Above`,
        target,
        iconCss: "e-icons e-add-above",
      },
      {
        text: "Below",
        id: `${ganttId}_contextMenu_Below`,
        target,
        iconCss: "e-icons e-add-below",
      },
      {
        text: "Child",
        id: `${ganttId}_contextMenu_${GANTT_CHILD_POPUP_MENU_KEY}`,
        target,
      },
      {
        text: "Milestone",
        id: `${ganttId}_contextMenu_Milestone`,
        target,
      },
    ],
  };
}

/** Proje görev listesi: kayıt için Guid id. Modules (ad) yalnızca geriye dönük fallback. */
function resolveToModuleIds(values: string[], moduleList: GanttModuleOption[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const t = String(raw ?? "").trim();
    if (!t) continue;
    let id = "";
    if (MODULE_GUID_RE.test(t)) {
      id = canonicalModuleId(t);
    } else {
      const lower = t.toLowerCase();
      const byName = moduleList.find((m) => String(m.name).trim().toLowerCase() === lower);
      if (byName) id = canonicalModuleId(byName.id);
    }
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function extractModuleIdsFromApiTask(task: any, moduleList: GanttModuleOption[] = []): string[] {
  const rawIds = task?.moduleIds ?? task?.ModuleIds;
  if (Array.isArray(rawIds) && rawIds.length > 0) {
    return resolveToModuleIds(rawIds.map(String), moduleList);
  }
  if (typeof rawIds === "string" && rawIds.trim()) {
    return resolveToModuleIds([rawIds], moduleList);
  }

  // Eski cevap: yalnızca Modules (ad) — mümkünse id'ye çevir
  const rawNames = task?.modules ?? task?.Modules;
  if (Array.isArray(rawNames) && rawNames.length > 0) {
    return resolveToModuleIds(rawNames.map(String), moduleList);
  }
  if (typeof rawNames === "string" && rawNames.trim()) {
    return resolveToModuleIds([rawNames], moduleList);
  }
  return [];
}

function extractProjectStatusFromApiTask(task: any): ProjectTypes | null {
  const raw = task?.projectStatus ?? task?.ProjectStatus;
  if (raw == null || raw === "") return null;
  return Number(raw) as ProjectTypes;
}

function normalizeProjectStatusFromRow(row: any): ProjectTypes | null {
  const raw =
    row?.projectStatus ??
    row?.ProjectStatus ??
    row?.taskData?.projectStatus ??
    row?.taskData?.ProjectStatus;
  if (raw == null || raw === "") return null;
  return Number(raw) as ProjectTypes;
}

const MODULE_GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Görev satırı ile GetActiveModules kayıtlarını aynı anahtarla eşlemek (GUID büyük/küçük harf farkı dahil). */
function canonicalModuleId(raw: string): string {
  const t = String(raw).trim();
  if (!t) return t;
  return MODULE_GUID_RE.test(t) ? t.toLowerCase() : t;
}

type GanttModuleOption = { id: string; name: string };

function normalizeActiveModulesFromApi(rawList: unknown): GanttModuleOption[] {
  if (!Array.isArray(rawList)) return [];
  const out: GanttModuleOption[] = [];
  for (const m of rawList) {
    if (!m || typeof m !== "object") continue;
    const anyM = m as Record<string, unknown>;
    const rawId = anyM.id ?? anyM.Id;
    if (rawId == null || String(rawId).trim() === "") continue;
    const id = canonicalModuleId(String(rawId));
    const nm = anyM.name ?? anyM.Name;
    const name = nm != null && String(nm).trim() !== "" ? String(nm).trim() : id;
    out.push({ id, name });
  }
  return out;
}

function resolveModuleDisplayName(moduleList: GanttModuleOption[], raw: string): string {
  const trimmed = String(raw).trim();
  if (!trimmed) return trimmed;
  const key = canonicalModuleId(trimmed);
  const byId = moduleList.find((m) => canonicalModuleId(m.id) === key);
  if (byId) return byId.name;
  const lower = trimmed.toLowerCase();
  const byName = moduleList.find((m) => String(m.name).trim().toLowerCase() === lower);
  if (byName) return byName.name;
  return trimmed;
}

/** Modül chip renkleri — id/ad üzerinden stabil palette seçimi */
const MODULE_CHIP_PALETTE = [
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-teal-200 bg-teal-50 text-teal-700",
  "border-indigo-200 bg-indigo-50 text-indigo-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  "border-amber-200 bg-amber-50 text-amber-800",
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-cyan-200 bg-cyan-50 text-cyan-800",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-orange-200 bg-orange-50 text-orange-800",
] as const;

function getModuleChipClass(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return MODULE_CHIP_PALETTE[hash % MODULE_CHIP_PALETTE.length];
}

/** Kök görev mi (Syncfusion / API: null, 0, boş). */
function isRootParentId(pid: unknown): boolean {
  if (pid === null || pid === undefined || pid === "") return true;
  const n = Number(pid);
  return n === 0 || Number.isNaN(n);
}

/**
 * Veri yenilendikten sonra ağacı kapatıp sadece bu TaskID satırının görünmesi için
 * kökten üst üste expand edilmesi gereken TaskID listesi (kök → ... → doğrudan üst).
 * Örn. 4 güncellenince [1]; 9 güncellenince [7]; 6 altında 4 altında 1 ise [1, 4].
 */
function getAncestorTaskIdsToExpandForTask(taskId: number, taskList: any[]): number[] {
  const byTaskId = new Map<number, any>();
  for (const t of taskList) {
    const tid = Number(t.TaskID);
    if (!Number.isNaN(tid)) byTaskId.set(tid, t);
  }
  const path: number[] = [];
  let cur = byTaskId.get(taskId);
  if (!cur) return path;
  while (cur) {
    const pid = cur.ParentID;
    if (isRootParentId(pid)) break;
    const p = byTaskId.get(Number(pid));
    if (!p) break;
    path.unshift(Number(p.TaskID));
    cur = p;
  }
  return path;
}

function clearSyncfusionGanttSpinner(gantt: GanttComponent | null) {
  const g = gantt as any;
  if (!g) return;
  try {
    g.hideLoadingIndicator?.();
  } catch {

  }
  try {
    g.hideSpinner?.();
  } catch {

  }
}

function removeOrphanSyncfusionDialogOverlays(doc: Document) {
  try {
    if (doc.querySelector(".e-dialog.e-popup-open")) return;
    doc.querySelectorAll(".e-dlg-overlay").forEach((n) => (n as HTMLElement).remove());
  } catch {

  }
}

function resetStuckEj2DialogBodyState(doc: Document) {
  try {
    doc.body?.classList.remove("e-dlg-target", "e-scroll-disabled");
    doc.documentElement?.classList.remove("e-dlg-target", "e-scroll-disabled");
  } catch {

  }
}

function tearDownSyncfusionBlockingUi(gantt: GanttComponent | null, doc?: Document) {
  const d = doc ?? (typeof document !== "undefined" ? document : null);
  if (!d) return;
  clearSyncfusionGanttSpinner(gantt);
  removeOrphanSyncfusionDialogOverlays(d);
  resetStuckEj2DialogBodyState(d);
}

function releaseGanttAfterAsyncToolbarAction(gantt: GanttComponent | null) {
  if (!gantt) return;
  const inst = gantt as any;

  try {
    inst.closeGanttActions?.();
    inst.editModule?.dialogObj?.hide?.();
  } catch {

  }

  const root = inst.element as HTMLElement | undefined;
  if (root) {
    root.style.removeProperty("pointer-events");
    root.querySelectorAll(".e-footer-content button.e-btn").forEach((btn) => {
      (btn as HTMLElement).style.removeProperty("pointer-events");
    });
  }

  document.querySelectorAll('.e-spinner-pane, .e-dialog-overlay').forEach((el) => {
    if (el && (el as HTMLElement).style.display !== 'none') {
      (el as HTMLElement).style.display = 'none';
    }
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      clearSyncfusionGanttSpinner(inst);
    });
  });
}

function hasExplicitModuleEditPayload(taskData: any): boolean {
  if (!taskData || typeof taskData !== "object") return false;
  if ("moduleIds" in taskData || "modules" in taskData) return true;
  const inner = taskData.taskData;
  return !!(inner && typeof inner === "object" && ("moduleIds" in inner || "modules" in inner));
}

function getAssigneeDisplayNames(resources: unknown): string[] {
  if (resources == null) return [];
  if (typeof resources === "string") {
    return resources
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(resources)) {
    return resources
      .map((r: any) => {
        if (typeof r === "string") return r.trim();
        const name = [r?.firstName, r?.lastName].filter(Boolean).join(" ").trim();
        return (r?.fullName || name || r?.userName || (r?.id != null ? String(r.id) : "")).trim();
      })
      .filter(Boolean);
  }
  return [];
}

function pickEditedTaskName(taskData: any, existing: any): string {
  const from =
    taskData?.TaskName ??
    taskData?.name ??
    taskData?.taskData?.TaskName ??
    taskData?.taskData?.name;
  if (from != null && String(from).trim().length > 0) return String(from).trim();
  return String(existing?.TaskName ?? "");
}

/**
 * PUT sonrası tam liste çekmeden state güncellemesi (yapısal değişiklik yoksa).
 */
function buildLocalRowPatchFromTaskData(
  taskData: any,
  calculatedDuration: number,
  existing: any
): Record<string, unknown> {
  const modulesArray = hasExplicitModuleEditPayload(taskData)
    ? resolveToModuleIds(normalizeModuleIdsFromRow(taskData), [])
    : normalizeModuleIdsFromRow(existing);

  const taskName = pickEditedTaskName(taskData, existing);

  const nextResources =
    taskData.resources !== undefined && taskData.resources !== null
      ? taskData.resources
      : existing.resources;

  return {
    Id: taskData.Id ?? existing.Id,
    TaskID: taskData.TaskID ?? existing.TaskID,
    TaskName: taskName,
    StartDate: taskData.StartDate ?? existing.StartDate,
    EndDate: taskData.EndDate ?? existing.EndDate,
    Duration: calculatedDuration,
    Progress: taskData.Progress ?? existing.Progress,
    Predecessor: taskData.Predecessor ?? existing.Predecessor,
    ParentID: taskData.ParentID ?? existing.ParentID,
    Notes: taskData.Notes ?? existing.Notes,
    IsManual: taskData.IsManual ?? existing.IsManual,
    Milestone: taskData.Milestone ?? existing.Milestone ?? false,
    resources: nextResources,
    modules: modulesArray.slice(),
    moduleIds: modulesArray.slice(),
    projectStatus:
      normalizeProjectStatusFromRow(taskData) ?? existing?.projectStatus ?? null,
  };
}

/** Gantt satırında moduleIds kökte veya taskData altında olabilir; yeni görevde Syncfusion boş string yazar. */
function normalizeModuleIdsFromRow(row: any): string[] {
  const raw =
    row?.moduleIds ??
    row?.taskData?.moduleIds ??
    row?.modules ??
    row?.Modules ??
    row?.taskData?.modules ??
    row?.taskData?.ModuleIds ??
    row?.taskData?.Modules;
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean).map(canonicalModuleId);
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    return t ? [canonicalModuleId(t)] : [];
  }
  return [];
}

function readModuleIdsFromDialogElement(
  root: HTMLElement | null | undefined,
): string[] | undefined {
  if (!root) return undefined;
  const moduleHost =
    root.querySelector<HTMLElement>(".gantt-module-status-row__modules") ?? root;
  const inst = (moduleHost as any)?.ej2_instances?.[0];
  if (!inst || inst.value === undefined) return undefined;
  const v = inst.value;
  if (Array.isArray(v)) {
    return v.map(String).filter(Boolean).map(canonicalModuleId);
  }
  return v ? [canonicalModuleId(String(v))] : [];
}

/** Modüller sekmesi Syncfusion save data'ya her zaman yansımaz; kayıt öncesi DOM'dan okunur. */
function mergeDialogModuleIdsIntoSaveData(data: any, moduleList: GanttModuleOption[]) {
  const editor = document.querySelector<HTMLElement>(
    ".e-dialog.e-popup-open .gantt-module-status-editor",
  );
  const fromDom = readModuleIdsFromDialogElement(editor);
  const raw = fromDom !== undefined ? fromDom : normalizeModuleIdsFromRow(data);
  applyModuleIdsToRow(data, resolveToModuleIds(raw, moduleList));
}

function refreshGanttDialogModuleStatusEditors(
  rowData: any,
  moduleList: GanttModuleOption[],
) {
  const ids = resolveToModuleIds(normalizeModuleIdsFromRow(rowData), moduleList);
  applyModuleIdsToRow(rowData, ids);
  const status = normalizeProjectStatusFromRow(rowData);

  document
    .querySelectorAll<HTMLElement>(".e-dialog.e-popup-open .gantt-module-status-editor")
    .forEach((host) => {
      const moduleHost =
        host.querySelector<HTMLElement>(".gantt-module-status-row__modules") ?? host;
      const statusHost = host.querySelector<HTMLElement>(".gantt-module-status-row__status");
      const moduleInst = getEj2InstanceFromHost(moduleHost);

      // Editor zaten varsa yeniden yaratma — Syncfusion boş string yazmış olabilir;
      // mevcut MultiSelect / DropDown değerini satır verisiyle güncelle.
      if (moduleInst) {
        try {
          moduleInst.dataSource = moduleList;
          moduleInst.value = ids;
          moduleInst.dataBind?.();
        } catch {
          renderModuleStatusEditor(host, rowData, moduleList, "composite");
          return;
        }
        if (statusHost) {
          const select = statusHost.querySelector<HTMLSelectElement>(
            "select.gantt-module-status-select",
          );
          if (select) {
            select.value = status == null ? STATUS_UNSET : String(status);
          } else {
            const statusInst = getEj2InstanceFromHost(statusHost);
            if (statusInst) {
              try {
                statusInst.value = status == null ? STATUS_UNSET : String(status);
                statusInst.dataBind?.();
              } catch {
                /* durum güncellenemedi — modüller yine de set edildi */
              }
            }
          }
        }
        return;
      }

      renderModuleStatusEditor(host, rowData, moduleList, "composite");
    });
}

function renderModuleStatusEditor(
  host: HTMLElement,
  rowData: any,
  moduleList: GanttModuleOption[],
  layout: "composite" | "modules-only",
) {
  host.innerHTML = "";
  host.className = "gantt-module-status-editor";
  host.style.width = "100%";

  if (layout === "modules-only") {
    appendModuleMultiSelect(host, rowData, moduleList);
    return;
  }

  const row = document.createElement("div");
  row.className = "gantt-module-status-row";
  const moduleHost = document.createElement("div");
  moduleHost.className = "gantt-module-status-row__modules";
  const statusHost = document.createElement("div");
  statusHost.className = "gantt-module-status-row__status";
  row.append(moduleHost, statusHost);
  host.appendChild(row);
  appendModuleMultiSelect(moduleHost, rowData, moduleList);
  appendStatusDropDown(statusHost, rowData);

  host.closest(".e-edit-form-column")?.classList.add("gantt-modules-tab-column");
}

function applyModuleIdsToRow(rowData: any, next: string[]) {
  rowData.moduleIds = next;
  rowData.modules = next;
  if (rowData.taskData) {
    rowData.taskData.moduleIds = next;
    rowData.taskData.modules = next;
  }
}

function applyProjectStatusToRow(rowData: any, next: ProjectTypes | null) {
  rowData.projectStatus = next;
  if (rowData.taskData) {
    rowData.taskData.projectStatus = next;
  }
}

/**
 * Durum değeri: Syncfusion DropDownList dialog içinde güvenilir değil;
 * native select kullan (popup/z-index/value tipi sorunları yok).
 */
const STATUS_UNSET = "__unset__" as const;

const GANTT_STATUS_NATIVE_OPTIONS: { label: string; value: string }[] = [
  { label: "Seçilmedi", value: STATUS_UNSET },
  ...projectTypeOptions.map((o) => ({ label: o.label, value: String(o.value) })),
];

function parseStatusSelectValue(raw: string | null | undefined): ProjectTypes | null {
  if (raw == null || raw === "" || raw === STATUS_UNSET) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? (n as ProjectTypes) : null;
}

function getEj2InstanceFromHost(host: HTMLElement | null | undefined): any | undefined {
  if (!host) return undefined;
  const direct = (host as any).ej2_instances?.[0];
  if (direct) return direct;
  const child = host.querySelector(
    ".e-multiselect, .e-dropdownlist, .e-ddl",
  ) as HTMLElement | null;
  if (child && (child as any).ej2_instances?.[0]) {
    return (child as any).ej2_instances[0];
  }
  const nodes = host.querySelectorAll<HTMLElement>("*");
  for (let i = 0; i < nodes.length; i++) {
    const inst = (nodes[i] as any).ej2_instances?.[0];
    if (!inst) continue;
    const name = inst.getModuleName?.();
    if (name === "dropdownlist" || name === "multiselect") return inst;
  }
  return undefined;
}

function readProjectStatusFromCompositeElement(
  root: HTMLElement | null | undefined,
): ProjectTypes | null | undefined {
  if (!root) return undefined;
  const statusHost = root.classList.contains("gantt-module-status-row__status")
    ? root
    : root.querySelector<HTMLElement>(".gantt-module-status-row__status");
  if (!statusHost) return undefined;

  const select = statusHost.querySelector<HTMLSelectElement>("select.gantt-module-status-select");
  if (select) {
    return parseStatusSelectValue(select.value);
  }

  const inst = getEj2InstanceFromHost(statusHost);
  if (!inst) return undefined;
  return parseStatusSelectValue(
    inst.value == null ? STATUS_UNSET : String(inst.value),
  );
}

function readModuleIdsFromCompositeElement(
  root: HTMLElement | null | undefined,
): string[] | undefined {
  if (!root) return undefined;
  const moduleHost = root.classList.contains("gantt-module-status-row__modules")
    ? root
    : root.querySelector<HTMLElement>(".gantt-module-status-row__modules") ?? root;
  const inst = getEj2InstanceFromHost(moduleHost);
  if (!inst) return undefined;
  const v = inst.value;
  if (v == null || v === "") return [];
  if (Array.isArray(v)) {
    return v.map(String).filter(Boolean).map(canonicalModuleId);
  }
  return [canonicalModuleId(String(v))];
}

/** Modüller sekmesindeki birleşik editör dialog kaydına dahil değil; save öncesi DOM'dan okunur. */
function mergeDialogModuleStatusIntoSaveData(data: any) {
  const editor = document.querySelector<HTMLElement>(
    ".e-dialog.e-popup-open .gantt-module-status-editor",
  );
  if (!editor) return;

  const moduleIds = readModuleIdsFromCompositeElement(editor);
  if (moduleIds !== undefined) {
    applyModuleIdsToRow(data, moduleIds);
  }

  const status = readProjectStatusFromCompositeElement(editor);
  if (status !== undefined) {
    applyProjectStatusToRow(data, status);
  }
}

/** Durum (projectStatus) yalnızca Modüller sekmesi composite editöründe; kayıttan önce DOM'dan çek. */
function mergeDialogProjectStatusIntoSaveData(data: any) {
  const editor = document.querySelector<HTMLElement>(
    ".e-dialog.e-popup-open .gantt-module-status-editor",
  );
  if (!editor) return;
  const status = readProjectStatusFromCompositeElement(editor);
  if (status !== undefined) {
    applyProjectStatusToRow(data, status);
  }
}

function appendModuleMultiSelect(
  host: HTMLElement,
  rowData: any,
  moduleList: GanttModuleOption[],
) {
  // Grid'de ad görünebilir; MultiSelect value alanı Guid id ister
  const ids = resolveToModuleIds(normalizeModuleIdsFromRow(rowData), moduleList);
  applyModuleIdsToRow(rowData, ids);
  const ms = new MultiSelect({
    dataSource: moduleList,
    fields: { text: "name", value: "id" },
    mode: "Box",
    placeholder: "Modüller seçin",
    width: "100%",
    value: ids,
    change: (e: { value?: unknown }) => {
      const v = e.value;
      const next = resolveToModuleIds(
        Array.isArray(v)
          ? v.map(String).filter(Boolean)
          : v
            ? [String(v)]
            : [],
        moduleList,
      );
      applyModuleIdsToRow(rowData, next);
    },
  });
  ms.appendTo(host);
  // Constructor value bazen dataSource bağlanmadan uygulanmaz
  if (ids.length > 0) {
    try {
      ms.value = ids;
      ms.dataBind();
    } catch {
      /* ignore */
    }
  }
  return ms;
}

function appendStatusDropDown(host: HTMLElement, rowData: any) {
  // Önceki Syncfusion instance / çocukları temizle
  host.querySelectorAll(".e-dropdownlist, .e-ddl, select.gantt-module-status-select").forEach((el) => {
    const inst = (el as any).ej2_instances?.[0];
    try {
      inst?.destroy?.();
    } catch {
      /* ignore */
    }
  });
  host.innerHTML = "";

  const label = document.createElement("label");
  label.className = "gantt-module-status-row__status-label";
  label.htmlFor = `gantt-status-${Math.random().toString(36).slice(2, 9)}`;
  label.textContent = "Durum";
  host.appendChild(label);

  const select = document.createElement("select");
  select.id = label.htmlFor;
  select.className = "gantt-module-status-select";
  select.setAttribute("aria-label", "Durum");

  const current = normalizeProjectStatusFromRow(rowData);
  for (const opt of GANTT_STATUS_NATIVE_OPTIONS) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  }
  select.value = current == null ? STATUS_UNSET : String(current);

  select.addEventListener("change", () => {
    applyProjectStatusToRow(rowData, parseStatusSelectValue(select.value));
  });

  host.appendChild(select);
  return select;
}

const RESOURCES_ADDITIONAL_PARAMS = {
  columns: [
    { field: "checkbox", headerText: "", width: 30, textAlign: "Center" },
    { field: "fullName", headerText: "Kullanıcı", width: 450 },
    { field: "id", headerText: "ID", width: 1, maxWidth: 1 },
    { field: "unit", headerText: "Birim", width: 1, maxWidth: 1 },
  ],
  allowFiltering: false,
} as any;

function ProjectChart() {
  const ganttRef = useRef<GanttComponent>(null);
  /** Unmount sonrası stale state update'leri engellemek için mounted bayrağı */
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  /**
   * create/update sonrası fetch ile veri bağlanana kadar bekleyip dataBound'da:
   * collapseAll, sonra ilgili dalı (kök başlıktan itibaren) expandByID ile açıyoruz.
   */
  const ganttAfterDataBoundRef = useRef<{ expandPathTaskIds: number[] } | null>(null);
  /**
   * dataBound ilk veri yüklemesinden sonra da Syncfusion spinner'ını temizlemeli.
   * tearDownAfterDataBoundRef=true ise dataBound'da tearDown çağrılır ve flag sıfırlanır.
   */
  const tearDownAfterDataBoundRef = useRef(false);
  const handleGanttDataBound = () => {
    // İlk yüklemeden sonra ya da explicit olarak işaretlendiyse spinner temizle
    if (tearDownAfterDataBoundRef.current) {
      tearDownAfterDataBoundRef.current = false;
      requestAnimationFrame(() => {
        tearDownSyncfusionBlockingUi(ganttRef.current);
      });
    }

    const pending = ganttAfterDataBoundRef.current;
    ganttAfterDataBoundRef.current = null;
    /** Tam veri bağlandıktan sonra ağaç işlemlerini bir sonraki frame'e erteler; UI thread'i kısa keser. */
    requestAnimationFrame(() => {
      try {
        // Varsayılan: her veri bağlanışında collapse all; create/update sonrası ilgili dal açılır.
        ganttRef.current?.collapseAll();
        if (pending) {
          for (const taskId of pending.expandPathTaskIds) {
            ganttRef.current?.expandByID(taskId);
          }
        }
      } catch {
        /* veri / tree henüz hazır değilse */
      }
      if (pending) {
        requestAnimationFrame(() => {
          tearDownSyncfusionBlockingUi(ganttRef.current);
        });
      }
    });
  };
  /** GetTaskModules sonuçları (liste endpoint'i modül döndürmeyebilir) */
  const taskModuleIdsCacheRef = useRef<Map<string, string[]>>(new Map());
  const [projectData, setProjectData] = useState<any[]>([]);
  const projectDataRef = useRef<any[]>([]);
  useEffect(() => {
    projectDataRef.current = projectData;
  }, [projectData]);

  useEffect(() => {
    const root = document.getElementById(GANTT_INSTANCE_ID);
    if (!root) return;

    const handleDialogTabClick = (event: MouseEvent) => {
      const tab = (event.target as HTMLElement).closest(".e-tab");
      if (!tab) return;
      const tabLabel = tab.textContent?.trim().toLocaleUpperCase("tr-TR");
      if (tabLabel !== "MODÜLLER") return;

      const gantt = ganttRef.current as any;
      const row =
        gantt?.editModule?.dialogModule?.processedRecord ??
        gantt?.editModule?.editedRecord;
      if (!row) return;

      const taskGuid = row?.Id ?? row?.taskData?.Id ?? row?.taskData?.id;
      const moduleList = moduleDataRef.current as GanttModuleOption[];
      if (taskGuid) {
        const cached = taskModuleIdsCacheRef.current.get(String(taskGuid));
        if (cached?.length) {
          applyModuleIdsToRow(row, resolveToModuleIds(cached, moduleList));
        } else {
          const fromRow = resolveToModuleIds(normalizeModuleIdsFromRow(row), moduleList);
          if (fromRow.length) applyModuleIdsToRow(row, fromRow);
        }
      }

      requestAnimationFrame(() => {
        refreshGanttDialogModuleStatusEditors(row, moduleList);
      });
    };

    root.addEventListener("click", handleDialogTabClick);
    return () => root.removeEventListener("click", handleDialogTabClick);
  }, []);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Kritik ID'ler URL'de, display bilgileri state'te (F5 sonrası da çalışır);
  // yeni sekmede açılan linkler state taşımadığından wcn/pn/psn query param'ları fallback olarak kullanılır.
  const workCompanyId = searchParams.get("cid");
  const projectId = searchParams.get("pid");
  const workCompanyName: string =
    location.state?.workCompanyName ?? searchParams.get("wcn") ?? "";
  const projectName: string = location.state?.projectName ?? searchParams.get("pn") ?? "";
  const projectSubName: string | undefined =
    location.state?.projectSubName ?? searchParams.get("psn") ?? undefined;
  const [pdfSettings, setPdfSettings] = useState({
    fileName: ``,
    pageSize: "A0",
    includeHiddenColumn: true,
    enableFooter: false,
    enableHeader: true,
    predecessorLines: true,
  });
  const dispatch = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();
  const [resources, setResources] = useState<UserAppDtoOnlyNameId[]>([
    {
      id: "",
      userName: "",
      firstName: "",
      lastName: "",
    },
  ]);
  const [moduleData, setModuleData] = useState<any[]>([]);
  /**
   * Syncfusion column edit template'leri ilk render'da setup edilir ve sonraki prop değişikliklerini
   * takip etmez. moduleDataRef her zaman güncel listeyi tutar; write() içinde ref.current okunarak
   * "No records found" sorunu çözülür.
   */
  const moduleDataRef = useRef<any[]>([]);
  useEffect(() => { moduleDataRef.current = moduleData; }, [moduleData]);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [excelSettings, setExcelSettings] = useState({
    fileName1: ``,
  });
  const [childBatchDialogOpen, setChildBatchDialogOpen] = useState(false);
  const [childBatchCount, setChildBatchCount] = useState(1);
  const [childBatchParentTaskData, setChildBatchParentTaskData] = useState<any>(null);
  const resourceFields: ResourceFieldsModel = {
    id: "id",
    name: "fullName", //yaklasık line 226 da resourcesWithFullName oluşturuluyor. sonrasında buraya binding ediliyor
  };

  const ganttStats = useMemo(
    () => buildProjectGanttStats(projectData, resources),
    [projectData, resources],
  );

  type ChartTab = "gantt" | "personnel";
  const [activeTab, setActiveTab] = useState<ChartTab>("gantt");

  const isProcessingTaskRef = useRef(false); // * burada flag-based locking yapıyoruz bu sayede aynı anda birden fazla task oluşturulamaz.

  const onRowSelected = async (args: any) => {
    const row = args?.data;
    const taskGuid = row?.taskData?.Id ?? row?.taskData?.id ?? row?.Id ?? row?.id;
    if (!taskGuid) return;
    const cached = taskModuleIdsCacheRef.current.get(taskGuid);
    // Boş cache ile erken çıkma — liste endpoint'i modül döndürmemiş olabilir
    if (cached && cached.length > 0) {
      return;
    }
    try {
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      const res = await api.apiProjectTasksGetTaskModulesGet(taskGuid);
      const ids = resolveToModuleIds(
        (res.data ?? []).map(String).filter(Boolean),
        moduleDataRef.current as GanttModuleOption[],
      );
      taskModuleIdsCacheRef.current.set(taskGuid, ids);
      setProjectData((prev) =>
        prev.map((t: any) =>
          t.Id === taskGuid ? { ...t, moduleIds: ids.slice(), modules: ids.slice() } : t
        )
      );
    } catch {
      /* sessiz: modüller grid için isteğe bağlı */
    }
  };
  useEffect(function ExportFileName() {
    if (!workCompanyName || !projectName) return;
    const suffix = projectSubName ? `_${projectSubName}` : "";
    const baseName = `${workCompanyName}_${projectName}${suffix}`;
    setPdfSettings((prev) => ({ ...prev, fileName: baseName }));
    setExcelSettings((prev) => ({ ...prev, fileName1: baseName }));
  }, [workCompanyName, projectName, projectSubName]);

  useEffect(() => {
    if (!workCompanyId || !projectId) {
      dispatchAlert({
        message:
          "Şirket ve proje seçimi yapılmadığı için, dashboard sayfasına yönlendiriliyorsunuz.",
        type: "error",
      });
      navigate("/projectmanagement");
      return;
    }
    // Önce kaynaklar (resources + modules) paralel yüklenir, ardından proje verisi çekilir.
    // Bu sıralama; resources prop'u hazır olmadan setProjectData çağrısının Gantt'a iki ayrı
    // prop güncellemesi göndererek data-binding'i yarıda kesmesini önler.
    const init = async () => {
      await Promise.all([fetchModulesData(), fetchProjectUsersData()]);
      if (!isMountedRef.current) return;
      await fetchProjectData({ clearModuleCache: true, showBusy: true });
    };
    init();
  }, [workCompanyId, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePdfDialogClose = () => {
    setPdfDialogOpen(false);
    requestAnimationFrame(() => tearDownSyncfusionBlockingUi(ganttRef.current));
  };

  const handleExcelDialogClose = () => {
    setExcelDialogOpen(false);
    requestAnimationFrame(() => tearDownSyncfusionBlockingUi(ganttRef.current));
  };

  const handlePdfSettingsChange = (prop: string) => (event: any) => {
    setPdfSettings({
      ...pdfSettings,
      [prop]:
        prop === "enableFooter" || prop === "enableHeader" || prop === "predecessorLines"
          ? event.target.checked
          : event.target.value,
    });
  };

  const handleExportPDF = async () => {
    if (ganttRef.current) {
      try {
        const exportProperties: PdfExportProperties = {
          fileName: `${pdfSettings.fileName}.pdf`, // Dosya adında da Türkçe karakter olabilir
          pageSize: pdfSettings.pageSize as any,
          includeHiddenColumn: pdfSettings.includeHiddenColumn,
          enableFooter: pdfSettings.enableFooter,
          enableHeader: true,
          fitToWidthSettings: {
            isFitToWidth: pdfSettings.pageSize === "A0",
          },
          showPredecessorLines: pdfSettings.predecessorLines,
          pageOrientation: "Landscape",
          header: {
            fromTop: 0,
            height: pdfSettings.pageSize === "A0" ? 350 : 200,
            contents: [
              {
                type: "Image",
                src: photoBase64,
                position: {
                  x: pdfSettings.pageSize === "A0" ? 4400 : pdfSettings.pageSize === "A4" ? 970 : 0,
                  y: 0,
                },
                size: {
                  height: pdfSettings.pageSize === "A0" ? 350 : 200,
                  width: pdfSettings.pageSize === "A0" ? 1000 : 500,
                },
                style: {},
              },
            ],
          },
          ganttStyle: {
            font: new PdfTrueTypeFont(font, 12, PdfFontStyle.Bold),
          },
        };

        ganttRef.current.pdfExport(exportProperties);
        handlePdfDialogClose();
      } catch (error) {
        console.error("PDF'ye dışa aktarma sırasında hata:", error);
        dispatchAlert({
          message: "PDF dışa aktarma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.",
          type: "error",
        });
      }
    }
  };

  const toolbarClick = (args: any) => {
    if (ganttRef.current) {
      if (args.item.id === ganttRef.current.element.id + "_pdfexport") {
        tearDownSyncfusionBlockingUi(ganttRef.current);
        setPdfDialogOpen(true);
      } else if (args.item.id === ganttRef.current.element.id + "_excelexport") {
        tearDownSyncfusionBlockingUi(ganttRef.current);
        setExcelDialogOpen(true);
      }
    }
  };

  const handleExcelSettingsChange = (prop: string) => (event: any) => {
    setExcelSettings({
      ...excelSettings,
      [prop]: event.target.value,
    });
  };

  const handleExcelExport = () => {
    if (ganttRef.current) {
      try {
        // * ilgili değiştirmeler bu kısmından exportPropoerties içinde yapılır.
        const exportProperties: ExcelExportProperties = {
          fileName: `${excelSettings.fileName1}.xlsx`, // Dosya adında da Türkçe karakter olabilir
          includeHiddenColumn: true,
          enableFilter: true,
          // columns: [
          //   { field: 'id', headerText: 'ID' },
          //   { field: 'TaskName', headerText: 'Başlık' },
          //   { field: 'Notes', headerText: 'Notlar' },
          // ] as unknown as Column[],
        };

        ganttRef.current.excelExport(exportProperties);
        handleExcelDialogClose();
      } catch (error) {
        console.error("Excel dışa aktarma sırasında hata:", error);
        dispatchAlert({
          message: "Excel dışa aktarma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.",
          type: "error",
        });
      }
    }
  };

  const fetchProjectUsersData = async () => {
    try {
      if (!projectId) {
        dispatchAlert({
          message: "Proje ID'si bulunamadı. Kullanıcı verileri yüklenemedi.",
          type: "error",
        });
        return;
      }

      dispatch({ isBusy: true });
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      const response = await api.apiProjectTasksGetProjectUsersGet(projectId);

      if (!response.data || !Array.isArray(response.data)) {
        dispatchAlert({
          message: "Proje kullanıcıları yüklenirken bir hata oluştu.",
          type: "error",
        });
        return;
      }

      const resourcesWithFullName = response.data.map((user) => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
      }));

      if (isMountedRef.current) setResources(resourcesWithFullName);
    } catch (error) {
      console.error("Error fetching project users data:", error);
      dispatchAlert({
        message: "Proje kullanıcıları yüklenirken bir hata oluştu.",
        type: "error",
      });
    } finally {
      dispatch({ isBusy: false });
    }
  };

  const fetchModulesData = async () => {
    try {
      dispatch({ isBusy: true });
      const config = getConfiguration();
      const api = new ModuleApi(config);
      const response = await api.apiModuleGetActiveModulesGet();

      if (!response.data || !Array.isArray(response.data)) {
        dispatchAlert({
          message: "Modüller yüklenirken bir hata oluştu.",
          type: "error",
        });
        return;
      }
      if (isMountedRef.current) setModuleData(normalizeActiveModulesFromApi(response.data));
    } catch (error) {
      dispatchAlert({
        message: "Modüller yüklenirken bir hata oluştu.",
        type: "error",
      });
    } finally {
      dispatch({ isBusy: false });
    }
  };

  const turkishToLatin = (text: string) => {
    const turkishToLatinMap = {
      İ: "I",
      ı: "i",
      Ş: "S",
      ş: "s",
      Ğ: "G",
      ğ: "g",
      Ü: "U",
      ü: "u",
      Ö: "O",
      ö: "o",
      Ç: "C",
      _: " ",
    };
    return text.replace(
      /[İıŞşĞğÜüÖöÇç_]/g,
      (match) => turkishToLatinMap[match as keyof typeof turkishToLatinMap] || match
    );
  };

  type FetchProjectDataOptions = { clearModuleCache?: boolean; showBusy?: boolean; _retryCount?: number };

  const fetchProjectData = async (options?: FetchProjectDataOptions): Promise<any[] | undefined> => {
    const showBusy = options?.showBusy !== false;
    const retryCount = options?._retryCount ?? 0;
    try {
      if (!projectId || !workCompanyId) {
        dispatchAlert({
          message: "Proje ve şirket seçimi zorunludur.",
          type: "error",
        });
        return undefined;
      }

      if (showBusy) {
        dispatch({ isBusy: true });
      }
      if (options?.clearModuleCache) {
        taskModuleIdsCacheRef.current.clear();
      }
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      const response = await api.apiProjectTasksGet(projectId);
      if (!response.data || !Array.isArray(response.data)) {
        dispatchAlert({
          message: "Proje verileri yüklenirken bir hata oluştu.",
          type: "error",
        });
        return undefined;
      }

      const transformedData = response.data.map((task: any) => {
        // Ensure users is always defined, even if it comes as null or undefined
        const users = task.Users || task.users || [];
        const modulesArray = extractModuleIdsFromApiTask(
          task,
          moduleDataRef.current as GanttModuleOption[],
        );
        const taskGuid = String(task.id ?? task.Id ?? "");
        if (taskGuid) {
          taskModuleIdsCacheRef.current.set(taskGuid, modulesArray.slice());
        }
        return {
          Id: task.id,
          TaskID: task.taskId,
          TaskName: turkishToLatin(task.name),
          StartDate: task.startDate,
          Duration: task.duration,
          Progress: task.progress,
          Predecessor: task.predecessor,
          ParentID: task.parentId,
          Notes: task.notes,
          IsManual: task.isManual,
          resources: users,
          modules: modulesArray,
          moduleIds: modulesArray.slice(),
          projectStatus: extractProjectStatusFromApiTask(task),
        };
      });
      const ascendingData = transformedData.sort((a: any, b: any) => a.TaskID - b.TaskID);
      if (!isMountedRef.current) return undefined;
      // dataBound ateşlendiğinde Syncfusion işini bitirmiş olacak; orada tearDown yap.
      tearDownAfterDataBoundRef.current = true;
      setProjectData(ascendingData);
      return ascendingData;
    } catch (error) {
      // 1 kez otomatik yeniden dene (token doğrulama gecikmesi veya geçici ağ hatası için)
      if (retryCount < 1 && isMountedRef.current) {
        await new Promise<void>((res) => setTimeout(res, 700));
        if (!isMountedRef.current) return undefined;
        return fetchProjectData({ ...options, showBusy: false, _retryCount: retryCount + 1 });
      }
      console.error("Error fetching project data:", error);
      if (isMountedRef.current) {
        dispatchAlert({
          message: "Proje verileri yüklenirken bir hata oluştu.",
          type: "error",
        });
      }
      tearDownAfterDataBoundRef.current = false; // hata → dataBound bekleme, hemen temizle
      requestAnimationFrame(() => tearDownSyncfusionBlockingUi(ganttRef.current));
      return undefined;
    } finally {
      if (showBusy && retryCount === 0) {
        dispatch({ isBusy: false });
      }
      // Güvenlik ağı: hata yolunda (flag=false) hemen temizle; başarı yolunda (flag=true)
      // dataBound'a 600ms öncelik ver — erken tearDown Syncfusion'ın data-binding sürecini kesebilir.
      if (!tearDownAfterDataBoundRef.current) {
        requestAnimationFrame(() => tearDownSyncfusionBlockingUi(ganttRef.current));
      } else {
        setTimeout(() => {
          if (tearDownAfterDataBoundRef.current) {
            tearDownAfterDataBoundRef.current = false;
            tearDownSyncfusionBlockingUi(ganttRef.current);
          }
        }, 600);
      }
    }
  };


  const taskFields: TaskFieldsModel = {
    id: "TaskID",
    name: "TaskName",
    startDate: "StartDate",
    duration: "Duration",
    endDate: "EndDate",
    progress: "Progress",
    dependency: "Predecessor",
    parentID: "ParentID", // buraya parentId alanı gösterilir
    milestone: "Milestone",
    notes: "Notes",
    manual: "IsManual",
    resourceInfo: "resources",

    // taskId: "TaskID",
  };

  const labelSettings: LabelSettingsModel = {
    rightLabel: "${taskData.TaskName}",
    taskLabel: "${Progress}%",
  };

  // Bağımlılık yok — moduleDataRef.current her zaman güncel veriyi tutar,
  // Syncfusion column editor setup'ını yalnızca ilk render'da yaptığı için memo stabil olmalı.
  const moduleIdsColumnEdit = useMemo(
    () => ({
      create: () => {
        const el = document.createElement("div");
        el.className = "gantt-module-status-editor";
        el.style.width = "100%";
        return el;
      },
      write: (args: { column: any; rowData: any; element: HTMLElement }) => {
        (args.element as any).__ganttEditRowData = args.rowData;
        renderModuleStatusEditor(
          args.element,
          args.rowData,
          moduleDataRef.current as GanttModuleOption[],
          "composite",
        );
      },
      read: (element: HTMLElement, value?: unknown) => {
        const status = readProjectStatusFromCompositeElement(element);
        if (status !== undefined) {
          const rowData = (element as any).__ganttEditRowData;
          if (rowData) applyProjectStatusToRow(rowData, status);
        }
        let raw: string[] = [];
        if (Array.isArray(value)) {
          raw = value.filter(Boolean).map(String);
        } else {
          const moduleHost =
            element.querySelector<HTMLElement>(".gantt-module-status-row__modules") ?? element;
          const inst = (moduleHost as any).ej2_instances?.[0];
          const v = inst?.value ?? [];
          raw = Array.isArray(v) ? v.map(String).filter(Boolean) : v ? [String(v)] : [];
        }
        return resolveToModuleIds(raw, moduleDataRef.current as GanttModuleOption[]);
      },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const projectStatusColumnEdit = useMemo(
    () => ({
      create: () => {
        const el = document.createElement("div");
        el.className = "gantt-module-status-row__status";
        return el;
      },
      write: (args: { rowData: any; element: HTMLElement }) => {
        appendStatusDropDown(args.element, args.rowData);
      },
      read: (element: HTMLElement) => {
        const select = element.querySelector<HTMLSelectElement>(
          "select.gantt-module-status-select",
        );
        if (select) return parseStatusSelectValue(select.value);
        return normalizeProjectStatusFromRow((element as any).__ganttEditRowData);
      },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const editSettings: EditSettingsModel = {
    allowAdding: true,
    allowEditing: true,
    allowDeleting: true,
    allowTaskbarEditing: true,
    showDeleteConfirmDialog: true,
    allowNextRowEdit: true,
    mode: "Dialog",
    newRowPosition: "Child",
  };

  const editDialogFields: EditDialogFieldSettingsModel[] = [
    { type: "General" as DialogFieldType, headerText: "Genel", fields: GANTT_GENERAL_DIALOG_FIELDS },
    { type: "Dependency" as DialogFieldType, headerText: "Bağımlılık" },
    { type: "Resources" as DialogFieldType, headerText: "Kaynaklar", additionalParams: RESOURCES_ADDITIONAL_PARAMS },
    { type: "Notes" as DialogFieldType, headerText: "Notlar" },
    { type: "Custom" as DialogFieldType, headerText: "Modüller", fields: ["moduleIds"] },
  ];
  const addDialogFields: AddDialogFieldSettingsModel[] = [
    { type: "General" as DialogFieldType, headerText: "Genel", fields: GANTT_GENERAL_DIALOG_FIELDS },
    { type: "Dependency" as DialogFieldType, headerText: "Bağımlılık" },
    { type: "Resources" as DialogFieldType, headerText: "Kaynaklar", additionalParams: RESOURCES_ADDITIONAL_PARAMS },
    { type: "Notes" as DialogFieldType, headerText: "Notlar" },
    { type: "Custom" as DialogFieldType, headerText: "Modüller", fields: ["moduleIds"] },
  ];
  const toolbarOptions = [
    "Add",
    "Edit",
    "Delete",
    "Update",
    "Cancel",
    "ExpandAll",
    "CollapseAll",
    "Search",
    "ZoomIn",
    "ZoomOut",
    "ZoomToFit",
    "PrevTimeSpan",
    "NextTimeSpan",
    "ExcelExport",
    "PdfExport",
  ];

  const calculateDuration = (start: Date, end: Date) => {
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  /** API: Duration zorunlu ve 0 olamaz (InsertTask doğrulaması). */
  const durationForInsert = (start: Date, end: Date) => Math.max(1, calculateDuration(start, end));

  /** C# tarafı ParentId string bekliyor (taskId / üst görev kimliği). */
  const parentIdForInsert = (parentID: unknown): string | undefined => {
    if (parentID === null || parentID === undefined || parentID === "") return undefined;
    return String(parentID);
  };

  /** Gantt bazen resources'u dizi, bazen virgüllü string verir; API TaskUsersDto[] bekler. */
  const usersForInsert = (resources: unknown): ProjectTasksInsertDto["users"] => {
    if (resources == null) return undefined;
    if (typeof resources === "string") return undefined;
    if (!Array.isArray(resources) || resources.length === 0) return undefined;
    const first = resources[0];
    if (typeof first !== "object" || first === null || !("id" in first)) return undefined;
    return resources as ProjectTasksInsertDto["users"];
  };

  type CreateTaskOptions = { silent?: boolean; skipFetch?: boolean };

  const createTask = async (args: any, options?: CreateTaskOptions) => {
    try {
      if (isProcessingTaskRef.current) {
        dispatchAlert({
          message: "Bir görev oluşturulurken hata oluştu. Lütfen daha sonra tekrar deneyin.",
          type: "error",
        });
        return false;
      }
      if (!projectId) {
        dispatchAlert({
          message: "Proje ID'si bulunamadı. Görev oluşturulamadı.",
          type: "error",
        });
        return false;
      }

      if (!args.taskData) {
        dispatchAlert({
          message: "Görev verileri eksik. Görev oluşturulamadı.",
          type: "error",
        });
        return false;
      }
      if (args.taskData.ParentID) {
        // ! KRİTİK : Eğer Alt Alan eklenmek istiyorsa ve herhangi bir hatadan dolayı parentId null ise, alert ver yoksa proje patlar.
        const parentTask = projectData.find(
          (task: any) => task.TaskID === Number(args.taskData.ParentID)
        );
        if (!parentTask) {
          dispatchAlert({
            message: "Üst görev bulunamadı. Görev oluşturulamadı.",
            type: "error",
          });
          return false;
        }
      }
      if (args.taskData.TaskID) {
        // ! KRİTİK : Eğer oluşturulmak istenen göreve ait taskId varsa yani duplicate durumu söz konusu ise, alert ver yoksa proje patlar.
        const task = projectData.find((task: any) => task.TaskID === args.taskData.TaskID);
        if (task) {
          dispatchAlert({
            message: "Oluşturulmak istenen göreve ait Id zaten mevcut. Görev oluşturulamadı.",
            type: "error",
          });
          return false;
        }
      }
      if (!args.taskData.StartDate || !args.taskData.EndDate) {
        dispatchAlert({
          message: "StartDate ve EndDate zorunludur.",
          type: "error",
        });
        return false;
      }
      isProcessingTaskRef.current = true;
      const startDate = new Date(args.taskData.StartDate);
      const endDate = new Date(args.taskData.EndDate);

      const calculatedDuration = durationForInsert(startDate, endDate);

      const config = getConfiguration();
      const moduleIdsPayload = resolveToModuleIds(
        normalizeModuleIdsFromRow(args.taskData),
        moduleDataRef.current as GanttModuleOption[],
      );

      const taskName =
        typeof args.taskData.TaskName === "string" && args.taskData.TaskName.trim().length > 0
          ? args.taskData.TaskName
          : "New Task";

      const body: ProjectTasksInsertDto = {
        duration: calculatedDuration,
        isManual: args.taskData.IsManual,
        name: `${turkishToLatin(taskName)}`,
        parentId: parentIdForInsert(args.taskData.ParentID),
        startDate: args.taskData.StartDate as string,
        predecessor: args.taskData.Predecessor ?? undefined,
        progress: args.taskData.Progress,
        notes: args.taskData.Notes,
        projectId: projectId,
        milestone: args.taskData.Milestone,
        taskId: args.taskData.TaskID,
        users: usersForInsert(args.taskData.resources),
        moduleIds: moduleIdsPayload,
        projectStatus: normalizeProjectStatusFromRow(args.taskData),
      };

      const api = new ProjectTasksApi(config);
      await api.apiProjectTasksPost(body);
      if (!options?.skipFetch) {
        const data = await fetchProjectData({ clearModuleCache: false, showBusy: true });
        const tid = args.taskData?.TaskID;
        if (data && tid != null) {
          ganttAfterDataBoundRef.current = {
            expandPathTaskIds: getAncestorTaskIdsToExpandForTask(Number(tid), data),
          };
        }
      }
      if (!options?.silent) {
        dispatchAlert({
          message: "Görev başarıyla oluşturuldu.",
          type: "success",
        });
      }
      return true;
    } catch (error) {
      console.error("Error creating task:", error);
      dispatchAlert({
        message: "Görev oluşturulurken bir hata oluştu.",
        type: "error",
      });
      return false;
    } finally {
      isProcessingTaskRef.current = false;
      requestAnimationFrame(() => {
        tearDownSyncfusionBlockingUi(ganttRef.current);
      });
    }
  };

  /** Child ile tek görev eklerken kullanılan createTask yolunu, seçilen adet kadar tekrarlar (beforeAdd ile aynı API gövdesi). */
  const createMultipleChildTasks = async () => {
    if (isProcessingTaskRef.current) {
      dispatchAlert({
        message: "Bir görev işlemi sürüyor. Lütfen bekleyin.",
        type: "error",
      });
      return;
    }
    if (!projectId || !childBatchParentTaskData) {
      dispatchAlert({
        message: "Üst görev veya proje bulunamadı.",
        type: "error",
      });
      return;
    }
    const parentTd = childBatchParentTaskData;
    const parentTask = projectData.find((task: any) => task.TaskID === Number(parentTd.TaskID));
    if (!parentTask) {
      dispatchAlert({
        message: "Üst görev bulunamadı. Görev oluşturulamadı.",
        type: "error",
      });
      return;
    }
    const count = Math.max(1, Math.min(30, Math.floor(Number(childBatchCount)) || 1));

    const start = getTodayForGantt();
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    let maxId = projectData.reduce(
      (max: number, t: any) => Math.max(max, Number(t.TaskID) || 0),
      0
    );

    dispatch({ isBusy: true });
    try {
      for (let i = 0; i < count; i++) {
        maxId += 1;
        const taskData: any = {
          TaskID: maxId,
          TaskName: turkishToLatin(`New Task`),
          StartDate: formatLocalDateForApi(start),
          EndDate: formatLocalDateForApi(end),
          ParentID: parentTd.TaskID,
          Progress: 0,
          Predecessor: undefined,
          Notes: "",
          IsManual: parentTd.IsManual ?? false,
          Milestone: false,
          resources: undefined,
          moduleIds: [],
          modules: [],
        };

        const ok = await createTask({ taskData }, { silent: true, skipFetch: true });
        if (!ok) {
          return;
        }
      }
      const data = await fetchProjectData({ clearModuleCache: false, showBusy: false });
      const parentTid = childBatchParentTaskData?.TaskID;
      if (data && parentTid != null) {
        ganttAfterDataBoundRef.current = {
          expandPathTaskIds: getAncestorTaskIdsToExpandForTask(Number(parentTid), data),
        };
      }
      setChildBatchDialogOpen(false);
      setChildBatchParentTaskData(null);
      dispatchAlert({
        message: `${count} alt görev oluşturuldu.`,
        type: "success",
      });
    } finally {
      dispatch({ isBusy: false });
      requestAnimationFrame(() => {
        tearDownSyncfusionBlockingUi(ganttRef.current);
      });
    }
  };

  const updateTask = async (args: any) => {
    const taskData = args.taskData ?? args;
    if (!projectId) {
      dispatchAlert({
        message: "Proje ID'si bulunamadı. Görev güncellenemedi.",
        type: "error",
      });
      return;
    }

    if (!taskData?.Id) {
      dispatchAlert({
        message: "Görev verileri eksik. Görev güncellenemedi.",
        type: "error",
      });
      return;
    }
    if (!taskData.StartDate || !taskData.EndDate) {
      dispatchAlert({
        message: "StartDate ve EndDate zorunludur.",
        type: "error",
      });
      return;
    }

    dispatch({ isBusy: true });
    try {
      const startDate = new Date(taskData.StartDate);
      const endDate = new Date(taskData.EndDate);

      const calculatedDuration = calculateDuration(startDate, endDate);

      const moduleIdsPayload = resolveToModuleIds(
        normalizeModuleIdsFromRow(taskData),
        moduleDataRef.current as GanttModuleOption[],
      );
      const existing = projectDataRef.current.find((t: any) => t.Id === taskData.Id) as any;

      const config = getConfiguration();

      const body: ProjectTasksUpdateDto = {
        id: taskData.Id,
        name:
          taskData.TaskName != null && String(taskData.TaskName).trim().length > 0
            ? taskData.TaskName
            : String(existing?.TaskName ?? ""),
        startDate: taskData.StartDate,
        projectId: projectId,
        duration: calculatedDuration,
        progress: taskData.Progress,
        predecessor: taskData.Predecessor ?? "",
        parentId: taskData.ParentID,
        milestone: taskData.Milestone ?? false,
        notes: taskData.Notes,
        isManual: taskData.IsManual,
        taskId: taskData.TaskID,
        users: taskData.resources,
        moduleIds: moduleIdsPayload,
        projectStatus: normalizeProjectStatusFromRow(taskData),
      };

      const api = new ProjectTasksApi(config);
      await api.apiProjectTasksPut(body);
      const ep = existing?.ParentID;
      const ap = taskData.ParentID;
      const parentUnchanged =
        !!existing &&
        ((isRootParentId(ep) && isRootParentId(ap)) ||
          (!isRootParentId(ep) && !isRootParentId(ap) && Number(ep) === Number(ap)));
      const taskIdUnchanged =
        existing && Number(existing.TaskID) === Number(taskData.TaskID);

      if (existing && parentUnchanged && taskIdUnchanged) {
        const patch = buildLocalRowPatchFromTaskData(taskData, calculatedDuration, existing);
        /** API'ye giden değerler anlık UI için tek doğruluk kaynağı; Syncfusion save sonrası taskData boşalabiliyor. */
        if (body.name != null && String(body.name).trim().length > 0) {
          patch.TaskName = body.name;
        }
        if (body.startDate != null) patch.StartDate = body.startDate;
        if (body.duration != null) patch.Duration = body.duration;
        if (body.progress !== undefined && body.progress !== null) patch.Progress = body.progress;
        if (body.predecessor !== undefined) patch.Predecessor = body.predecessor;
        if (body.parentId !== undefined && body.parentId !== null) patch.ParentID = body.parentId;
        if (body.notes !== undefined) patch.Notes = body.notes;
        if (body.milestone !== undefined && body.milestone !== null) patch.Milestone = body.milestone;
        if (body.isManual !== undefined && body.isManual !== null) patch.IsManual = body.isManual;
        if (body.users !== undefined) patch.resources = body.users;
        patch.moduleIds = moduleIdsPayload.slice();
        patch.modules = moduleIdsPayload.slice();
        patch.projectStatus = normalizeProjectStatusFromRow(taskData);
        setProjectData((prev) =>
          prev.map((t: any) => (t.Id === taskData.Id ? { ...t, ...patch } : t))
        );
        const guid = taskData.Id;
        if (guid) {
          const mids = (patch.moduleIds as string[]) ?? [];
          taskModuleIdsCacheRef.current.set(String(guid), mids.slice());
        }
      } else {
        const data = await fetchProjectData({ clearModuleCache: false, showBusy: false });
        const tid = taskData?.TaskID;
        if (data && tid != null) {
          ganttAfterDataBoundRef.current = {
            expandPathTaskIds: getAncestorTaskIdsToExpandForTask(Number(tid), data),
          };
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
      dispatchAlert({
        message: "Görev güncellenirken bir hata oluştu.",
        type: "error",
      });
    } finally {
      dispatch({ isBusy: false });
      requestAnimationFrame(() => {
        tearDownSyncfusionBlockingUi(ganttRef.current);
      });
    }
  };

  const deleteTask = async (args: any) => {
    if (!Array.isArray(args) || args.length === 0) {
      dispatchAlert({
        message: "Silinecek görev bulunamadı.",
        type: "error",
      });
      return;
    }

    const idArray = args.map((obj: any) => {
      if (!obj || !obj.taskData || !obj.taskData.Id) {
        throw new Error("Geçersiz görev verisi");
      }
      return obj.taskData.Id;
    });

    if (idArray.length === 0) {
      dispatchAlert({
        message: "Silinecek görev bulunamadı.",
        type: "error",

      });
      return;
    }

    dispatch({ isBusy: true });
    try {
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      await api.apiProjectTasksDelete(idArray);
      await fetchProjectData({ clearModuleCache: false, showBusy: false });
      dispatchAlert({
        message: "Görev(ler) başarıyla silindi.",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      dispatchAlert({
        message: "Görev silinirken bir hata oluştu.",
        type: "error",
      });
    } finally {
      dispatch({ isBusy: false });
      requestAnimationFrame(() => {
        tearDownSyncfusionBlockingUi(ganttRef.current);
      });
    }
  };

  // Add custom date format handler
  const handleDateFormat = (args: any) => {
    if (args.columnName === "StartDate" && args.value) {
      try {
        // Ensure proper date format handling
        const date = new Date(args.value);
        if (!isNaN(date.getTime())) {
          // Format as yyyy-MM-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          args.value = `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.error("Error formatting date:", error);
      }
    }
  };

  const actionBegin = async (args: any) => {
    // Handle date format for edit dialog
    if (args.requestType === "beginEdit" || args.requestType === "add") {
      handleDateFormat(args);
    }

    if (args.requestType === "beforeAdd") {
      args.cancel = true; // SENKRON OLARAK İLK BURADA İPTAL EDİN
      mergeDialogModuleIdsIntoSaveData(args.data, moduleDataRef.current as GanttModuleOption[]);
      mergeDialogProjectStatusIntoSaveData(args.data);
      try {
        const editor = document.querySelector<HTMLElement>(
          ".e-dialog.e-popup-open .gantt-module-status-editor",
        );
        const rowFromEditor = (editor as any)?.__ganttEditRowData;
        if (rowFromEditor && Object.prototype.hasOwnProperty.call(rowFromEditor, "projectStatus")) {
          applyProjectStatusToRow(
            args.data,
            normalizeProjectStatusFromRow(rowFromEditor),
          );
        }
      } catch {
        /* ignore */
      }
      await createTask(args.data);
      releaseGanttAfterAsyncToolbarAction(ganttRef.current);

    } else if (args.requestType === "beforeDelete") {
      args.cancel = true; // ÖNCE İPTAL EDİN
      await deleteTask(args.data);
      releaseGanttAfterAsyncToolbarAction(ganttRef.current);

    } else if (args.requestType === "beforeSave") {
      args.cancel = true; // ÇOK ÖNEMLİ: await'ten ÖNCE yazılmalı!
      mergeDialogModuleIdsIntoSaveData(args.data, moduleDataRef.current as GanttModuleOption[]);
      // Durum: 1) DOM dropdown 2) composite editörün rowData'sı 3) Syncfusion editedRecord
      mergeDialogProjectStatusIntoSaveData(args.data);
      try {
        const editor = document.querySelector<HTMLElement>(
          ".e-dialog.e-popup-open .gantt-module-status-editor",
        );
        const rowFromEditor = (editor as any)?.__ganttEditRowData;
        if (rowFromEditor && Object.prototype.hasOwnProperty.call(rowFromEditor, "projectStatus")) {
          applyProjectStatusToRow(
            args.data,
            normalizeProjectStatusFromRow(rowFromEditor),
          );
        } else {
          const gantt = ganttRef.current as any;
          const edited =
            gantt?.editModule?.dialogModule?.processedRecord ??
            gantt?.editModule?.editedRecord;
          if (edited && Object.prototype.hasOwnProperty.call(edited, "projectStatus")) {
            applyProjectStatusToRow(args.data, normalizeProjectStatusFromRow(edited));
          }
        }
      } catch {
        /* ignore */
      }
      await updateTask(args.data);

      // İşlem bitince diyaloğu manuel kapatın (cancel=true olduğu için açık kalır)
      if (ganttRef.current) {
        try {
          (ganttRef.current as any).editModule?.dialogObj?.hide();
        } catch (e) {
          // Sessizce yut
        }
      }
      releaseGanttAfterAsyncToolbarAction(ganttRef.current);

    } else if (args.requestType === "beforeOpenAddDialog") {
      applyTodayAsDefaultTaskDates(args.rowData);
    } else if (args.requestType === "beforeOpenEditDialog") {
      const row = args.rowData;
      const taskGuid = row?.Id ?? row?.taskData?.Id ?? row?.taskData?.id;
      if (taskGuid) {
        try {
          const moduleList = moduleDataRef.current as GanttModuleOption[];
          let ids = taskModuleIdsCacheRef.current.get(taskGuid);
          // Boş veya yoksa API'den çek; ad/GUID karışık gelebilir → resolveToModuleIds
          if (!ids || ids.length === 0) {
            const config = getConfiguration();
            const api = new ProjectTasksApi(config);
            const res = await api.apiProjectTasksGetTaskModulesGet(taskGuid);
            ids = resolveToModuleIds(
              (res.data ?? []).map(String).filter(Boolean),
              moduleList,
            );
            taskModuleIdsCacheRef.current.set(taskGuid, ids);
          } else {
            ids = resolveToModuleIds(ids, moduleList);
          }
          applyModuleIdsToRow(row, ids);
          // Dialog write çoğu zaman bu await'ten önce boş value ile çalışır; sekmeye
          // geçince ve sonraki frame'lerde MultiSelect'i yeniden doldur.
          const pushToEditors = () =>
            refreshGanttDialogModuleStatusEditors(row, moduleList);
          requestAnimationFrame(() => {
            requestAnimationFrame(pushToEditors);
          });
          window.setTimeout(pushToEditors, 0);
          window.setTimeout(pushToEditors, 120);
        } catch (e) {
          console.error("GetTaskModules:", e);
        }
      }
    }
  };

  const actionComplete = (args: any) => {
    if (args.requestType === "save" || args.requestType === "add") {
      if (args.data && args.data.StartDate) {
        handleDateFormat(args.data);
      }
    }
  };

  const contextMenuItems = useMemo(() => {
    const items: any[] = [
      "AutoFitAll",
      "AutoFit",
      "TaskInformation",
      "DeleteTask",
      "Save",
      "Cancel",
      "SortAscending",
      "SortDescending",
    ];
    items.push(buildAddMenuWithChildPopup(GANTT_INSTANCE_ID));
    items.push(
      "DeleteDependency",
      "Convert",
      { text: "Collapse the Row", target: ".e-content", id: "collapserow" },
      { text: "Expand the Row", target: ".e-content", id: "expandrow" },
      { text: "Hide Column", target: ".e-gridheader", id: "hidecols" }
    );
    return items;
  }, []);

  const contextMenuClick = (args: any) => {
    const gid = ganttRef.current?.element?.id;
    if (gid && args.item?.id === `${gid}_contextMenu_${GANTT_CHILD_POPUP_MENU_KEY}`) {
      const row = args.rowData;
      const td = row?.taskData ?? row;
      if (td?.TaskID != null) {
        setChildBatchParentTaskData(td);
        setChildBatchCount(1);
        setChildBatchDialogOpen(true);
      }
      return;
    }
    let record = args.rowData;
    if (args.item.id === "collapserow") {
      ganttRef.current?.collapseByID(Number(record.ganttProperties.taskId));
    }
    if (args.item.id === "expandrow") {
      ganttRef.current?.expandByID(Number(record.ganttProperties.taskId));
    }
    if (args.item.id === "hidecols") {
      ganttRef.current?.hideColumn(args.column.headerText);
    }
  };
  const contextMenuOpen = (args: any) => {
    let record = args.rowData;
    if (args.type !== "Header") {
      if (!record.hasChildRecords) {
        args.hideItems.push("Collapse the Row");
        args.hideItems.push("Expand the Row");
      } else {
        if (record.expanded) {
          args.hideItems.push("Expand the Row");
        } else {
          args.hideItems.push("Collapse the Row");
        }
      }
    }
  };
  const handleTaskbarInfo = (args: any) => {
    const progress = args.data.Progress;

    if (progress >= 50) {
      args.taskbarBgColor = "#BCCCDC";
    }
  };
  const handleBackClick = () => {
    const workCompany: WorkCompanyDto = {
      id: workCompanyId ?? undefined,
      name: workCompanyName,
    };
    navigate("/projectmanagement", {
      state: {
        showTest: true,
        workCompany,
        projectId,
      },
    });
  };

  const formatOption = { type: "date", format: "dd.MM.yyyy" };
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <style>{customStyles}</style>
      <ShadcnCard className="mb-2 overflow-hidden border-0 shadow-sm ring-1 ring-foreground/8">
        <div className="relative flex items-center gap-0">
          {/* Sol aksan çizgisi */}
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-linear-to-b from-blue-500 to-indigo-600" />

          {/* Geri Butonu */}
          <div className="flex items-center pl-5 pr-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBackClick}
              aria-label="Geri git"
              className="size-8 rounded-lg text-muted-foreground transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </div>

          {/* Dikey Ayırıcı */}
          <div className="h-9 w-px shrink-0 bg-border" />

          {/* İkon + Başlık Bloğu */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 shadow-sm">
              <FolderKanban className="size-4 text-white" />
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Proje Gantt Grafiği
              </span>
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <span>{workCompanyName || "—"}</span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                <span className="text-foreground/80">{projectName || "—"}</span>
                {projectSubName && (
                  <>
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="text-foreground/60">{projectSubName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ShadcnCard>

      {/* ── Tab switcher ─────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Görünüm seçimi"
        className="mb-2 flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "gantt"}
          aria-controls="panel-gantt"
          id="tab-gantt"
          tabIndex={activeTab === "gantt" ? 0 : -1}
          onClick={() => setActiveTab("gantt")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
            activeTab === "gantt"
              ? "bg-white dark:bg-card text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-card/60",
          )}
        >
          <FolderKanban className="size-4 shrink-0" aria-hidden />
          Gantt Chart
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "personnel"}
          aria-controls="panel-personnel"
          id="tab-personnel"
          tabIndex={activeTab === "personnel" ? 0 : -1}
          onClick={() => setActiveTab("personnel")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
            activeTab === "personnel"
              ? "bg-white dark:bg-card text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-card/60",
          )}
        >
          <Users className="size-4 shrink-0" aria-hidden />
          Kişi İstatistikleri
        </button>
      </div>

      {/* ── Gantt tab ────────────────────────────────────────────────── */}
      <div
        id="panel-gantt"
        role="tabpanel"
        aria-labelledby="tab-gantt"
        hidden={activeTab !== "gantt"}
      >
        <ProjectStatsPanel
          totalTasks={ganttStats.totalTasks}
          completedTasks={ganttStats.completedTasks}
          inProgressTasks={ganttStats.inProgressTasks}
          avgProgress={ganttStats.avgProgress}
          assigneeCount={ganttStats.assigneeCount}
        />
      </div>

      {/* ── Personnel tab ────────────────────────────────────────────── */}
      {activeTab === "personnel" && (
        <section
          id="panel-personnel"
          role="tabpanel"
          aria-labelledby="tab-personnel"
        >
          <PersonnelStatsView tasks={projectData} workCompanyId={workCompanyId} />
        </section>
      )}

      {/* ── Gantt container (kept mounted to preserve Syncfusion state) ─ */}
      <div
        style={{ height: "calc(100vh - 240px)", width: "100%", overflow: "hidden", display: activeTab === "gantt" ? undefined : "none" }}
        className="gantt-chart-container"
      >
        <GanttComponent
          key={projectId != null ? String(projectId) : "gantt"}
          id={GANTT_INSTANCE_ID}
          ref={ganttRef}
          // created={onGanttCreated}
          rowSelected={onRowSelected}
          dataBound={handleGanttDataBound}

          locale="en-US"
          height="100%"
          width="100%"
          actionBegin={actionBegin}
          actionComplete={actionComplete}
          allowFiltering={true}
          allowSorting={true}
          allowParentDependency
          allowReordering
          allowResizing
          allowPdfExport={true}
          resources={resources}
          resourceFields={resourceFields}
          allowExcelExport={true}
          highlightWeekends={true}
          editSettings={editSettings}
          toolbar={toolbarOptions}
          toolbarClick={toolbarClick}
          dataSource={projectData}
          taskFields={taskFields}
          taskType="FixedDuration"
          collapseAllParentTasks={true}
          enableContextMenu={true}
          queryTaskbarInfo={handleTaskbarInfo}
          tooltipSettings={{
            showTooltip: true,
            taskbar: "true",
          }}
          timelineSettings={{
            showTooltip: true,
            timelineUnitSize: 50,
            topTier: {
              unit: "Week",
              format: "MMM dd, yyyy",
            },
            bottomTier: {
              unit: "Day",
              format: "dd",
            },
          }}
          dateFormat="dd.MM.yyyy" // Add explicit date format
          splitterSettings={{ position: "48%" }}
          workWeek={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]}
          selectionSettings={{ mode: "Row", type: "Multiple" }}
          durationUnit="Day"
          dayWorkingTime={[{ from: 9, to: 18 }]}
          contextMenuItems={contextMenuItems as ContextMenuItem[]}
          contextMenuClick={contextMenuClick}
          contextMenuOpen={contextMenuOpen}
          labelSettings={labelSettings}
        >
          <AddDialogFieldsDirective>
            <AddDialogFieldDirective type="General" headerText="Genel" fields={GANTT_GENERAL_DIALOG_FIELDS} />
            <AddDialogFieldDirective type="Dependency" headerText="Bağımlılık" />
            <AddDialogFieldDirective type="Resources" headerText="Kaynaklar" additionalParams={RESOURCES_ADDITIONAL_PARAMS} />
            <AddDialogFieldDirective type="Notes" headerText="Notlar" />
            <AddDialogFieldDirective type="Custom" headerText="Modüller" fields={["moduleIds"]} />
          </AddDialogFieldsDirective>
          <EditDialogFieldsDirective>
            <EditDialogFieldDirective type="General" headerText="Genel" fields={GANTT_GENERAL_DIALOG_FIELDS} />
            <EditDialogFieldDirective type="Dependency" headerText="Bağımlılık" />
            <EditDialogFieldDirective type="Resources" headerText="Kaynaklar" additionalParams={RESOURCES_ADDITIONAL_PARAMS} />
            <EditDialogFieldDirective type="Notes" headerText="Notlar" />
            <EditDialogFieldDirective type="Custom" headerText="Modüller" fields={["moduleIds"]} />
          </EditDialogFieldsDirective>
          <Inject
            services={[
              Toolbar,
              Edit,
              Selection,
              ContextMenu,
              Sort,
              Filter,
              Resize,
              Reorder,
              PdfExport,
              ExcelExport,
              DayMarkers,
              ColumnMenu,
              RowDD,
            ]}
          />
          <ColumnsDirective>
            <ColumnDirective field="TaskID" headerText="ID" width="55" />
            <ColumnDirective
              field="TaskName"
              headerText="Görev Adı"
              width="200"
              template={(props: any) => {
                if (!props.Notes || props.Notes.length === 0) {
                  return <div>{props.TaskName}</div>;
                }
                return (
                  <div className="flex items-center gap-1">
                    <ShadcnTooltipProvider>
                      <ShadcnTooltip>
                        <ShadcnTooltipTrigger asChild>
                          <MessageSquare className="size-4 shrink-0 rounded bg-black p-0.5 text-white" />
                        </ShadcnTooltipTrigger>
                        <ShadcnTooltipContent className="flex flex-col gap-1">
                          <span className="text-xs font-bold">Notlar:</span>
                          <span className="text-xs">{props.Notes}</span>
                        </ShadcnTooltipContent>
                      </ShadcnTooltip>
                    </ShadcnTooltipProvider>
                    {props.TaskName}
                  </div>
                );
              }}
            />
            <ColumnDirective
              field="projectStatus"
              headerText="Durum"
              width="120"
              edit={projectStatusColumnEdit}
              template={(props: any) => {
                const status = normalizeProjectStatusFromRow(props);
                const label = getProjectStatusLabel(status);
                const colors = getProjectTypeColumnColors(label);
                return (
                  <span
                    className={cn(
                      "inline-flex max-w-full items-center truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                      colors.badge,
                    )}
                    title={label}
                  >
                    {label}
                  </span>
                );
              }}
            />
            <ColumnDirective
              field="moduleIds"
              headerText="Modüller"
              width="180"
              edit={moduleIdsColumnEdit}
              template={(props: any) => {
                const ids = normalizeModuleIdsFromRow(props);
                if (ids.length === 0) return <span className="text-slate-400">-</span>;
                const list = moduleDataRef.current as GanttModuleOption[];
                return (
                  <div className="flex flex-wrap items-center gap-1 py-0.5">
                    {ids.map((id) => {
                      const name = resolveModuleDisplayName(list, id);
                      return (
                        <span
                          key={id}
                          className={cn(
                            "inline-flex max-w-[140px] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            getModuleChipClass(id || name),
                          )}
                          title={name}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                );
              }}
            />
            <ColumnDirective
              field="resources"
              headerText="Atananlar"
              width="130"
              template={(props: any) => {
                const assignees = getAssigneeDisplayNames(props.resources);
                if (assignees.length === 0) return <>-</>;
                if (assignees.length === 1) {
                  return <div className="flex items-center">{assignees[0]}</div>;
                }
                return (
                  <div className="flex items-center gap-1.5">
                    {assignees[0]}
                    <ShadcnTooltipProvider>
                      <ShadcnTooltip>
                        <ShadcnTooltipTrigger asChild>
                          <div className="flex size-5 shrink-0 cursor-default items-center justify-center rounded-full border border-black bg-black text-xs text-white">
                            +{assignees.length - 1}
                          </div>
                        </ShadcnTooltipTrigger>
                        <ShadcnTooltipContent>
                          {assignees.slice(1).join(", ")}
                        </ShadcnTooltipContent>
                      </ShadcnTooltip>
                    </ShadcnTooltipProvider>
                  </div>
                );
              }}
            />

            <ColumnDirective
              field="StartDate"
              headerText="Başlangıç"
              width="150"
              format={formatOption}
              type="date"
              edit={{ params: { format: "dd.MM.yyyy" } }}
            />

            <ColumnDirective field="Duration" headerText="Süre (gün)" allowEditing={false} />
            <ColumnDirective
              field="EndDate"
              headerText="Bitiş"
              type="date"
              format={formatOption}
              edit={{ params: { format: "dd.MM.yyyy" } }}
            />
            <ColumnDirective field="Progress" headerText="İlerleme (%)" />
          </ColumnsDirective>
        </GanttComponent>
      </div>


      {/* Excel Export Dialog */}
      <ShadcnDialog open={excelDialogOpen} onOpenChange={(open) => !open && handleExcelDialogClose()}>
        <ShadcnDialogContent className="sm:max-w-md">
          <ShadcnDialogHeader>
            <ShadcnDialogTitle>Excel Dışa Aktarma Ayarları</ShadcnDialogTitle>
          </ShadcnDialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="excel-filename">Dosya Adı</Label>
              <Input
                id="excel-filename"
                value={excelSettings.fileName1}
                onChange={handleExcelSettingsChange("fileName1")}
              />
            </div>
          </div>
          <ShadcnDialogFooter>
            <Button variant="outline" onClick={handleExcelDialogClose}>
              İptal
            </Button>
            <Button onClick={handleExcelExport}>
              Excel Dışa Aktar
            </Button>
          </ShadcnDialogFooter>
        </ShadcnDialogContent>
      </ShadcnDialog>

      {/* PDF Export Dialog */}
      <ShadcnDialog open={pdfDialogOpen} onOpenChange={(open) => !open && handlePdfDialogClose()}>
        <ShadcnDialogContent className="sm:max-w-md">
          <ShadcnDialogHeader>
            <ShadcnDialogTitle>PDF Dışa Aktarma Ayarları</ShadcnDialogTitle>
          </ShadcnDialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pdf-filename">Dosya Adı</Label>
              <Input
                id="pdf-filename"
                value={pdfSettings.fileName}
                onChange={handlePdfSettingsChange("fileName")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pdf-pagesize">Sayfa Boyutu</Label>
              <ShadcnSelect
                value={pdfSettings.pageSize}
                onValueChange={(val) =>
                  setPdfSettings((prev) => ({ ...prev, pageSize: val }))
                }
              >
                <ShadcnSelectTrigger id="pdf-pagesize" className="w-full">
                  <ShadcnSelectValue placeholder="Boyut seçin" />
                </ShadcnSelectTrigger>
                <ShadcnSelectContent
                  className="z-[1200]"
                  position="popper"
                  sideOffset={4}
                >
                  <ShadcnSelectItem value="A0">A0</ShadcnSelectItem>
                  <ShadcnSelectItem value="A4">A4</ShadcnSelectItem>
                </ShadcnSelectContent>
              </ShadcnSelect>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Alt Bilgiyi Göster</span>
                <ShadcnSwitch
                  checked={pdfSettings.enableFooter}
                  onCheckedChange={(checked) =>
                    setPdfSettings((prev) => ({ ...prev, enableFooter: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bağımlılık Çizgilerini Göster</span>
                <ShadcnSwitch
                  checked={pdfSettings.predecessorLines}
                  onCheckedChange={(checked) =>
                    setPdfSettings((prev) => ({ ...prev, predecessorLines: checked }))
                  }
                />
              </div>
            </div>
          </div>
          <ShadcnDialogFooter>
            <Button variant="outline" onClick={handlePdfDialogClose}>
              İptal
            </Button>
            <Button onClick={handleExportPDF}>
              PDF Dışa Aktar
            </Button>
          </ShadcnDialogFooter>
        </ShadcnDialogContent>
      </ShadcnDialog>

      {/* Child Batch Dialog */}
      <ShadcnDialog
        open={childBatchDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setChildBatchDialogOpen(false);
            setChildBatchParentTaskData(null);
          }
        }}
      >
        <ShadcnDialogContent className="sm:max-w-xs">
          <ShadcnDialogHeader>
            <ShadcnDialogTitle>Alt görev ekle</ShadcnDialogTitle>
          </ShadcnDialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seçilen görevin altına kaç adet yeni görev oluşturulsun? (1–30)
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="child-batch-count">Adet</Label>
              <ShadcnSelect
                value={String(childBatchCount)}
                onValueChange={(val) => setChildBatchCount(Number(val))}
              >
                <ShadcnSelectTrigger id="child-batch-count" className="w-full">
                  <ShadcnSelectValue />
                </ShadcnSelectTrigger>
                <ShadcnSelectContent
                  className="z-[1200] max-h-60"
                  position="popper"
                  sideOffset={4}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                    <ShadcnSelectItem key={n} value={String(n)}>
                      {n}
                    </ShadcnSelectItem>
                  ))}
                </ShadcnSelectContent>
              </ShadcnSelect>
            </div>
          </div>
          <ShadcnDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChildBatchDialogOpen(false);
                setChildBatchParentTaskData(null);
              }}
            >
              İptal
            </Button>
            <Button onClick={createMultipleChildTasks}>
              Oluştur
            </Button>
          </ShadcnDialogFooter>
        </ShadcnDialogContent>
      </ShadcnDialog>
    </DashboardLayout>
  );
}

export default ProjectChart;