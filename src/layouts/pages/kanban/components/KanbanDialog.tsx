import React, { useEffect, useRef, useState } from "react";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS } from "../types/kanban.types";
import { UserApi, UserAppDtoOnlyNameId, UserAppDtoWithoutPhoto } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "../../hooks/useAlert";

interface KanbanDialogProps {
  props: any;
  assigneeData: UserAppDtoWithoutPhoto[];
}

const KanbanDialog: React.FC<KanbanDialogProps> = ({ props, assigneeData = [] }) => {
  const [openerId, setOpenerId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  console.log("Dialog assigneeData:", assigneeData);
  console.log("Dialog props:", props);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    Status: "Open",
    Type: "Task",
    Priority: "Normal",
    Assignee: "",
    AssigneeId: "",
    Summary: "",
    Description: "",
    Tags: "",
    RankId: String(1),
  });

  useEffect(() => {
    let initialAssignee = (props?.Assignee as string) || "";
    if (!initialAssignee && props?.AssigneeId && assigneeData?.length) {
      const match = assigneeData.find((u) => u.id === props.AssigneeId);
      if (match) initialAssignee = `${match.firstName || ""} ${match.lastName || ""}`.trim();
    }
    setForm({
      Status: (props?.Status as string) || "Open",
      Type: (props?.Type as string) || "Task",
      Priority: (props?.Priority as string) || "Normal",
      Assignee: initialAssignee,
      AssigneeId: (props?.AssigneeId as string) || "",
      Summary: (props?.Summary as string) || "",
      Description: (props?.Description as string) || "",
      Tags: (props?.Tags as string) || "",
      RankId: String((props?.RankId as number) ?? 1),
    });
  }, [props, assigneeData]);

  const validateFields = (): { ok: boolean; firstError?: string } => {
    const values: Record<string, string> = {
      Id: (document.getElementById("Id") as HTMLInputElement)?.value || "",
      Status: (document.getElementById("Status") as HTMLSelectElement)?.value || "",
      Type: (document.getElementById("Type") as HTMLSelectElement)?.value || "",
      Priority: (document.getElementById("Priority") as HTMLSelectElement)?.value || "",
      Assignee: (document.getElementById("Assignee") as HTMLSelectElement)?.value || "",
      AssigneeId: (document.getElementById("AssigneeId") as HTMLInputElement)?.value || "",
      Summary: (document.getElementById("Summary") as HTMLInputElement)?.value || "",
      // Description: (document.getElementById("Description") as HTMLTextAreaElement)?.value || "",
      // Tags: (document.getElementById("Tags") as HTMLInputElement)?.value || "",
      RankId: (document.getElementById("RankId") as HTMLInputElement)?.value?.toString() || "",
    };

    console.log("values", values);

    const requiredKeys = [
      "Status",
      "Summary",
      "Assignee",
      "AssigneeId",
      // "Description",
      "Priority",
      "RankId",
      // "Tags",
      "Type",
    ];

    if (values.Id) requiredKeys.unshift("Id");

    console.log("values", values);

    const newErrors: Record<string, string> = {};
    let firstError: string | undefined;
    for (const key of requiredKeys) {
      if (!values[key] || values[key].trim() === "") {
        newErrors[key] = `${key} alanı zorunludur`;
        if (!firstError) firstError = key;
      }
    }
    setErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, firstError };
  };
  useEffect(() => {
    const getOpenerId = async () => {
      try {
        const dialogElement = containerRef.current?.closest(".e-dialog") as HTMLElement | null;
        if (!dialogElement) return;
        const header = dialogElement.querySelector(".e-dlg-header") as HTMLElement | null;
        const title = header?.textContent;
        if (title === "Add New Card") return;
        dispatchBusy({ isBusy: true });
        let config = getConfiguration();
        let api = new UserApi(config);
        let response = await api.apiUserGetLoginUserGet();
        setOpenerId(response.data.id);
        let response2 = await api.apiUserCheckIsAdminGet();
        setIsAdmin(response2.data);
      } catch (error) {
        console.error("Error getting opener id:", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    getOpenerId();
  }, []);

  useEffect(() => {
    try {
      const dialogElement = containerRef.current?.closest(".e-dialog") as HTMLElement | null;
      if (!dialogElement) return;

      const footer = dialogElement.querySelector(".e-footer-content") as HTMLElement | null;
      if (!footer) return;

      let deleteButton: HTMLButtonElement | null = footer.querySelector('button[title="Delete"]');
      if (!deleteButton) {
        const buttons = Array.from(footer.querySelectorAll("button")) as HTMLButtonElement[];
        deleteButton =
          buttons.find((btn) => (btn.textContent || "").trim().toLowerCase() === "delete") || null;
      }
      if (!deleteButton) return;

      const canSeeDelete = (Boolean(openerId) && openerId === (props?.creatorId ?? "")) || isAdmin;
      deleteButton.style.display = canSeeDelete ? "" : "none";
    } catch (error) {}
  }, [openerId, props?.creatorId, isAdmin]);

  useEffect(() => {
    const dialogElement = containerRef.current?.closest(".e-dialog") as HTMLElement | null;
    if (!dialogElement) return;

    const footer = dialogElement.querySelector(".e-footer-content") as HTMLElement | null;
    if (!footer) return;

    const buttons = Array.from(footer.querySelectorAll("button")) as HTMLButtonElement[];
    const saveBtn = buttons.find((btn) => {
      const t = (btn.textContent || "").trim().toLowerCase();
      return t === "save" || t === "update";
    });
    if (!saveBtn) return;

    const onSaveClick = (e: Event) => {
      const { ok, firstError } = validateFields();
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
        // Focus first invalid field
        if (firstError) {
          const el = document.getElementById(firstError);
          if (el && "focus" in el)
            (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus();
        }
        dispatchAlert({ message: `${firstError} Boş olamaz`, type: "Error" });
        return false as unknown as void;
      }
      return undefined;
    };

    saveBtn.addEventListener("click", onSaveClick, true);
    return () => {
      saveBtn.removeEventListener("click", onSaveClick, true);
    };
  }, [containerRef, props]);

  const dialogStyles = {
    container: {
      padding: "24px",
      paddingBottom: "0px",
      
      // backgroundColor: '#ffffff',
      // borderRadius: '12px',
      // boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      width: "100%",
      maxWidth: "800px",
      
      margin: "0 auto",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      marginBottom: "24px",
      paddingBottom: "16px",
      borderBottom: "1px solid #e5e7eb",
    },
    title: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1f2937",
      margin: "0",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "24px",
    },
    fieldGroup: {
      display: "flex",
      flexDirection: "column" as const,
    },
    fullWidth: {
      gridColumn: "1 / -1",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "6px",
      display: "block",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#ffffff",
      transition: "all 0.2s ease",
      outline: "none",
      boxSizing: "border-box" as const,
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#ffffff",
      transition: "all 0.2s ease",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box" as const,
    },
    textarea: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#ffffff",
      transition: "all 0.2s ease",
      outline: "none",
      resize: "vertical" as const,
      minHeight: "100px",
      fontFamily: "inherit",
      boxSizing: "border-box" as const,
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      paddingTop: "20px",
      borderTop: "1px solid #e5e7eb",
      marginTop: "24px",
    },
    button: {
      padding: "10px 20px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      border: "none",
      transition: "all 0.2s ease",
    },
    deleteButton: {
      backgroundColor: "#ef4444",
      color: "#ffffff",
      marginRight: "auto",
    },
    cancelButton: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
    },
    saveButton: {
      backgroundColor: "#3b82f6",
      color: "#ffffff",
    },
  };

  // Add responsiveness without changing structure/logic
  useEffect(() => {
    const applyResponsiveDialogStyles = () => {
      try {
        const dialogElement = containerRef.current?.closest(".e-dialog") as HTMLElement | null;
        if (!dialogElement) return;

        const content = dialogElement.querySelector(".e-dlg-content") as HTMLElement | null;
        const footer = dialogElement.querySelector(".e-footer-content") as HTMLElement | null;
        const header = dialogElement.querySelector(".e-dlg-header") as HTMLElement | null;

        const headerHeight = header?.offsetHeight || 0;
        const footerHeight = footer?.offsetHeight || 0;
        const verticalChrome = headerHeight + footerHeight + 32; // paddings/margins

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Breakpoints: mobile <= 576, tablet <= 1200, desktop > 1200
        const isMobile = vw <= 576;
        const isTablet = vw > 576 && vw <= 1200;
        const isDesktop = vw > 1200;

        if (isMobile) {
          dialogElement.style.width = "66vw";
          dialogElement.style.maxWidth = "66vw";
          dialogElement.style.height = "auto";
          dialogElement.style.maxHeight = "85vh";
          dialogElement.style.margin = "0 auto";
          dialogElement.style.borderRadius = "12px";
          dialogElement.style.minWidth = "0";
          dialogElement.style.boxSizing = "border-box";

          if (content) {
            content.style.maxHeight = `${Math.max(200, vh * 0.85 - verticalChrome)}px`;
            content.style.overflowY = "auto";
            content.style.overflowX = "hidden";
            content.style.padding = "12px";
            content.style.width = "100%";
            const controls = content.querySelectorAll<HTMLElement>(
              "input, select, textarea, .e-input, .e-input-group, .e-field"
            );
            controls.forEach((el) => {
              el.style.setProperty("min-width", "0", "important");
              el.style.setProperty("width", "100%", "important");
              el.style.setProperty("max-width", "100%", "important");
              el.style.boxSizing = "border-box";
            });

            // Also ensure any inline style widths from third-party widgets are neutralized
            const wideEls = content.querySelectorAll<HTMLElement>(
              "[style*='min-width'], [style*='width:']"
            );
            wideEls.forEach((el) => {
              el.style.setProperty("min-width", "0", "important");
              if (el.tagName !== "LABEL") {
                el.style.setProperty("width", "100%", "important");
                el.style.setProperty("max-width", "100%", "important");
              }
            });
          }

          // Force single column grid inside dialog content
          const container = containerRef.current as HTMLElement | null;
          const grid = container ? (container.querySelector("div") as HTMLElement | null) : null;
          if (grid && grid.style) {
            grid.style.gridTemplateColumns = "1fr";
            grid.style.gap = grid.style.gap || "16px";
          }
        } else if (isTablet) {
          dialogElement.style.width = "40vw";
          dialogElement.style.maxWidth = "40vw";
          dialogElement.style.height = "auto";
          dialogElement.style.maxHeight = "88vh";
          dialogElement.style.margin = "0 auto";
          dialogElement.style.borderRadius = "12px";
          dialogElement.style.minWidth = "0";
          dialogElement.style.boxSizing = "border-box";

          if (content) {
            content.style.maxHeight = `${Math.max(240, vh * 0.88 - verticalChrome)}px`;
            content.style.overflowY = "auto";
            content.style.overflowX = "hidden";
            content.style.width = "100%";

            if (vw <= 900) {
              const controls = content.querySelectorAll<HTMLElement>(
                "input, select, textarea, .e-input, .e-input-group, .e-field"
              );
              controls.forEach((el) => {
                el.style.setProperty("min-width", "0", "important");
                el.style.setProperty("width", "100%", "important");
                el.style.setProperty("max-width", "100%", "important");
                el.style.boxSizing = "border-box";
              });
            }
          }

          // Use single column up to ~900px, two columns otherwise
          const container = containerRef.current as HTMLElement | null;
          const grid = container ? (container.querySelector("div") as HTMLElement | null) : null;
          if (grid && grid.style) {
            grid.style.gridTemplateColumns = vw <= 900 ? "1fr" : "1fr 1fr";
          }
        } else {
          // Desktop: constrain width and height so it doesn't feel oversized
          dialogElement.style.width = "33vw";
          dialogElement.style.maxWidth = "1100px";
          dialogElement.style.height = "auto";
          dialogElement.style.maxHeight = "86vh";
          dialogElement.style.margin = "0 auto";
          dialogElement.style.borderRadius = "12px";

          if (content) {
            content.style.maxHeight = `${Math.max(260, vh * 0.86 - verticalChrome)}px`;
            content.style.overflowY = "auto";
            content.style.overflowX = "hidden";
          }

          const container = containerRef.current as HTMLElement | null;
          const grid = container ? (container.querySelector("div") as HTMLElement | null) : null;
          if (grid && grid.style) {
            grid.style.gridTemplateColumns = "1fr 1fr";
          }
        }
      } catch {}
    };

    applyResponsiveDialogStyles();
    window.addEventListener("resize", applyResponsiveDialogStyles);
    return () => window.removeEventListener("resize", applyResponsiveDialogStyles);
  }, [containerRef]);

  return (
    <div ref={containerRef} style={dialogStyles.container  }>
      <div style={dialogStyles.grid}>
        <div style={dialogStyles.fieldGroup}>
          <label style={dialogStyles.label}>
            Status<span style={{ color: "#ef4444" }}> *</span>
          </label>
          <select
            id="Status"
            name="Status"
            className="e-field"
            value={form.Status}
            style={dialogStyles.select}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            onChange={(e) => setForm((f) => ({ ...f, Status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={dialogStyles.fieldGroup}>
          <label style={dialogStyles.label}>
            Type<span style={{ color: "#ef4444" }}> *</span>
          </label>
          {form.Type === "Ticket" ? (
            <>
              <div
                style={{
                  ...dialogStyles.select,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  height: "auto",
                  backgroundColor: "#f8fafc",
                  cursor: "not-allowed",
                  userSelect: "none",
                  borderColor: "#e2e8f0",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600,
                    backgroundColor: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd",
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#0ea5e9", display: "inline-block" }} />
                    Ticket
                  </span>
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Ticket tarafından oluşturuldu</span>
              </div>
              {/* Hidden field keeps the value for Syncfusion */}
              <input type="hidden" id="Type" name="Type" className="e-field" value="Ticket" readOnly />
            </>
          ) : (
            <select
              id="Type"
              name="Type"
              className="e-field"
              value={form.Type}
              style={dialogStyles.select}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              onChange={(e) => setForm((f) => ({ ...f, Type: e.target.value }))}
            >
              {TYPE_OPTIONS.filter((o) => o !== "Ticket").map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
          <label style={dialogStyles.label}>
            Priority<span style={{ color: "#ef4444" }}> *</span>
          </label>
          <select
            id="Priority"
            name="Priority"
            className="e-field"
            style={dialogStyles.select}
            value={form.Priority}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            onChange={(e) => setForm((f) => ({ ...f, Priority: e.target.value }))}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
          <label style={dialogStyles.label}>
            Assignee<span style={{ color: "#ef4444" }}> *</span>
          </label>
          <select
            id="Assignee"
            name="Assignee"
            className="e-field"
            value={form.Assignee}
            style={dialogStyles.select}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            onChange={(e) => {
              const select = e.target as HTMLSelectElement;
              const selectedOption = select.selectedOptions[0];
              const id = (selectedOption && selectedOption.getAttribute("data-id")) || "";
              setForm((f) => ({ ...f, Assignee: select.value, AssigneeId: id }));
              const hidden = document.getElementById("AssigneeId") as HTMLInputElement | null;
              if (hidden) {
                hidden.value = id;
                hidden.setAttribute("value", id);
                hidden.dispatchEvent(new Event("input", { bubbles: true }));
                hidden.dispatchEvent(new Event("change", { bubbles: true }));
              }
              setErrors((prev) => ({ ...prev, Assignee: "", AssigneeId: "" }));
            }}
          >
            <option value="">Select Assignee</option>
            {assigneeData &&
              assigneeData.map((item: UserAppDtoWithoutPhoto) => {
                const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim();
                return (
                  <option key={item.id} value={fullName} data-id={item.id}>
                    {fullName || "Unknown User"}
                  </option>
                );
              })}
          </select>
          {errors.Assignee && (
            <span style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.Assignee}</span>
          )}
        </div>

        <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
          <label style={dialogStyles.label}>
            Summary<span style={{ color: "#ef4444" }}> *</span>
          </label>
          <input
            id="Summary"
            name="Summary"
            type="text"
            className="e-field"
            value={form.Summary}
            placeholder="Enter task summary"
            style={dialogStyles.input}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            onChange={(e) => setForm((f) => ({ ...f, Summary: e.target.value }))}
            onInput={() => setErrors((prev) => ({ ...prev, Summary: "" }))}
          />
          {errors.Summary && (
            <span style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.Summary}</span>
          )}
        </div>

        <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
          <label style={dialogStyles.label}>
            Description
            {/* <span style={{ color: "#ef4444" }}> *</span> */}
          </label>
          <textarea
            id="Description"
            name="Description"
            className="e-field"
            value={form.Description}
            placeholder="Enter detailed description"
            style={dialogStyles.textarea}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            onChange={(e) => setForm((f) => ({ ...f, Description: e.target.value }))}
            onInput={() => setErrors((prev) => ({ ...prev, Description: "" }))}
          />
          {errors.Description && (
            <span style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>
              {errors.Description}
            </span>
          )}
        </div>

        <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
          <label style={dialogStyles.label}>
            Tags (comma separated)
            {/* <span style={{ color: "#ef4444" }}> *</span> */}
          </label>
          <input
            id="Tags"
            name="Tags"
            type="text"
            className="e-field"
            value={form.Tags}
            placeholder="e.g. Frontend, Bug, Critical"
            style={dialogStyles.input}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            onChange={(e) => setForm((f) => ({ ...f, Tags: e.target.value }))}
            onInput={() => setErrors((prev) => ({ ...prev, Tags: "" }))}
          />
          {errors.Tags && (
            <span style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.Tags}</span>
          )}
        </div>
      </div>

      {/* Hidden fields for Syncfusion Kanban */}
      <input
        type="hidden"
        id="AssigneeId"
        name="AssigneeId"
        className="e-field"
        value={form.AssigneeId}
        readOnly
      />
      <input
        type="hidden"
        id="RankId"
        name="RankId"
        className="e-field"
        value={form.RankId}
        readOnly
      />
      <input
        id="Id"
        name="Id"
        type="hidden"
        className="e-field"
        disabled
        readOnly
        defaultValue={props.Id || ""}
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          backgroundColor: "#f9fafb",
          color: "#6b7280",
          cursor: "not-allowed",
          transition: "all 0.2s ease",
          outline: "none",
          boxSizing: "border-box" as const,
        }}
      />
    </div>
  );
};

export default KanbanDialog;
