import React, { useEffect } from "react";
import { MessageBox as UI5MessageBox, MessageBoxAction, Title } from "@ui5/webcomponents-react";
import { ThemingParameters } from "@ui5/webcomponents-react-base";
import "./index.css";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
interface MessageBoxProps {
  isQuestionmessageBoxOpen: boolean;
  handleCloseQuestionBox: (action: string, escPressed?: boolean) => void;
  type?: string;
  description?: string;
  setDescription?: (description: string) => void;
  numberManDay?: number;
  setNumberManDay?: (numberManDay: number) => void;
  canEditManDay?: boolean;
  lastnumberManDay?: number;
  isMsp?: boolean;
  mspClientId?: string | null;
  customerRefName?: string | null;
}

function MessageBox({
  isQuestionmessageBoxOpen,
  handleCloseQuestionBox,
  type,
  description,
  setDescription,
  numberManDay,
  setNumberManDay,
  canEditManDay,
  lastnumberManDay,
  isMsp,
  mspClientId,
  customerRefName,
}: MessageBoxProps) {
  useEffect(() => {
    if (numberManDay == null || numberManDay == 0) {
      numberManDay = lastnumberManDay;
    }
  }, []);
  return (
    <UI5MessageBox
      open={isQuestionmessageBoxOpen}
      onClose={handleCloseQuestionBox}
      actions={[MessageBoxAction.Cancel, MessageBoxAction.Yes]}
      header={
        <>
          {type ? (
            <Title style={headerStyle}>
              Kayıt {type === "approve" ? "Onaylanacaktır" : "Reddedilecektir"}
              {isMsp ? " — MSP Müşterisi" : ""}
            </Title>
          ) : (
            <Title style={headerStyle}>Kayıt Silinecektir</Title>
          )}
          <span style={closeIconStyle} onClick={() => handleCloseQuestionBox("Cancel")}>
            ×
          </span>
        </>
      }
      style={messageBoxStyle}
    >
      {type ? (
        <div className="flex flex-col gap-1">
          {isMsp ? (
            <div
              className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2"
              role="status"
              aria-label={
                [
                  "MSP müşterisi",
                  customerRefName?.trim() || null,
                  mspClientId?.trim() ? `Client ID: ${mspClientId.trim()}` : null,
                ]
                  .filter(Boolean)
                  .join(", ")
              }
            >
              <span className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                MSP
              </span>
              <span className="text-sm font-medium text-orange-800">
                Bu talep bir MSP müşterisine aittir.
              </span>
              {customerRefName?.trim() ? (
                <span className="text-sm font-semibold text-orange-900" title={customerRefName.trim()}>
                  {customerRefName.trim()}
                </span>
              ) : null}
              {mspClientId?.trim() ? (
                <span className="inline-flex items-baseline gap-1.5 text-sm text-orange-800">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600">
                    Client ID
                  </span>
                  <span className="font-mono font-semibold" title={mspClientId.trim()}>
                    {mspClientId.trim()}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}
          {type === "approve" ? (
            <>
              <span style={contentStyle}>Adam/Gün</span>
              <Input
                disabled={canEditManDay}
                value={numberManDay ?? ""}
                onChange={(e) => setNumberManDay?.(Number(e.target.value))}
                type="number"
                placeholder="Adam/Gün giriniz"
                className="mb-3"
                onKeyDown={(e) => {
                  if (e.key === "e" || e.key === "E") e.preventDefault();
                }}
              />
            </>
          ) : null}

          <span style={contentStyle}>
            {type === "approve" ? "Onay Açıklaması " : "Reddedilme Nedenini "}
          </span>
          <Textarea
            value={description ?? ""}
            onChange={(e) => setDescription?.(e.target.value)}
            rows={3}
            placeholder={type === "approve" ? "Onay Açıklaması giriniz" : "Reddedilme Nedeni giriniz"}
            className="mb-3 resize-none"
          />
        </div>
      ) : null}
      {type ? (
        <span style={{ ...contentStyle, color: "red" }}>
          Kayıt {type === "approve" ? "Onaylandıktan sonra" : "Reddedildikten sonra"} işlem geri
          alınamaz.
        </span>
      ) : (
        <span style={contentStyle}>Bu işlem geri alınamaz.</span>
      )}
    </UI5MessageBox>
  );
}

// Styles
const messageBoxStyle = {
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  borderRadius: "12px",
  minWidth: "400px",
  position: "relative" as const,
};

const headerStyle = {
  color: "black",
  fontSize: "1.25rem",
  fontWeight: 600,
  padding: "0.35rem 0",
  marginRight: "24px", // Make space for close icon
};

const closeIconStyle = {
  position: "absolute" as const,
  right: "12px",
  top: "14px",
  fontSize: "20px",
  cursor: "pointer",
  color: ThemingParameters.sapContent_IconColor,
  width: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  transition: "background-color 0.2s",
  ":hover": {
    backgroundColor: ThemingParameters.sapButton_Lite_Hover_Background,
  },
};

const contentStyle = {
  display: "block",
  padding: "0.5rem 0",
  fontSize: "1rem",
  color: ThemingParameters.sapTextColor,
};

// Add this to your component's style overrides or global CSS

export default MessageBox;
