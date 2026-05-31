import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { AlertCircle, HelpCircle, Info, X } from "lucide-react";
import "../MessageBox/index.css";

interface MessageBoxProps {
  isQuestionmessageBoxOpen: boolean;
  handleCloseQuestionBox: (action: string, escPressed?: boolean) => void;
  titleText: string;
  contentText: string;
  warningText?: {
    text: string;
    color: string;
  };
  type: "warning" | "question" | "info" | "error";
}

const getThemeColor = (type: MessageBoxProps["type"]): string => {
  switch (type) {
    case "warning":
    case "error":
      return "rgba(244, 67, 54, 0.85)";
    case "question":
    case "info":
      return "rgba(33, 150, 243, 0.85)";
    default:
      return "rgba(33, 150, 243, 0.85)";
  }
};

const getAccentColor = (type: MessageBoxProps["type"]): string => {
  switch (type) {
    case "warning":
    case "error":
      return "rgba(244, 67, 54, 0.08)";
    case "question":
    case "info":
      return "rgba(33, 150, 243, 0.08)";
    default:
      return "rgba(33, 150, 243, 0.08)";
  }
};

const TypeIcon = ({ type }: { type: MessageBoxProps["type"] }) => {
  const color = getThemeColor(type);
  const cls = "size-6 shrink-0";

  switch (type) {
    case "warning":
    case "error":
      return <AlertCircle className={cls} style={{ color }} />;
    case "question":
      return <HelpCircle className={cls} style={{ color }} />;
    case "info":
      return <Info className={cls} style={{ color }} />;
    default:
      return <HelpCircle className={cls} style={{ color }} />;
  }
};

function CustomMessageBox({
  isQuestionmessageBoxOpen,
  handleCloseQuestionBox,
  titleText,
  contentText,
  warningText,
  type = "error",
}: MessageBoxProps) {
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isQuestionmessageBoxOpen) setIsVisible(true);
  }, [isQuestionmessageBoxOpen]);

  const handleConfirm = () => handleCloseQuestionBox("Evet");
  const handleCancel = () => handleCloseQuestionBox("İptal");

  const themeColor = getThemeColor(type);
  const accentColor = getAccentColor(type);

  return (
    <Dialog
      open={isQuestionmessageBoxOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseQuestionBox("Cancel", true);
      }}
    >
      <DialogContent
        ref={messageBoxRef}
        className="p-0 gap-0 w-[480px] max-w-[480px] rounded-xl border border-black/6 shadow-lg bg-white overflow-hidden"
        onAnimationEnd={() => { if (!isQuestionmessageBoxOpen) setIsVisible(false); }}
      >
        {/* Colored top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl opacity-60"
          style={{ backgroundColor: themeColor }}
        />

        <DialogHeader className="flex flex-row items-center gap-3 px-6 pt-7 pb-4">
          <TypeIcon type={type} />
          <DialogTitle className="text-[18px] font-medium tracking-tight leading-snug">
            {titleText}
          </DialogTitle>
          <button
            aria-label="Kapat"
            onClick={() => handleCloseQuestionBox("Cancel")}
            className="absolute right-4 top-4 rounded-md p-1.5 text-black/40 transition-all hover:bg-black/4 hover:text-black/60 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        <div className="px-6 pb-6">
          <p className="text-sm leading-relaxed text-black/70">{contentText}</p>

          {warningText && (
            <div
              className="mt-4 flex items-start gap-3 rounded-lg px-4 py-3 text-[13px] leading-relaxed"
              style={{ color: themeColor, backgroundColor: accentColor }}
            >
              <AlertCircle className="size-[18px] mt-px shrink-0" />
              <span>{warningText.text}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 px-6 pb-6 pt-0">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="h-9 min-w-[80px] rounded-md bg-black/3 px-4 text-sm font-medium text-black/60 hover:bg-black/6 hover:-translate-y-px transition-all"
          >
            İptal
          </Button>
          <Button
            onClick={handleConfirm}
            className="h-9 min-w-[80px] rounded-md px-4 text-sm font-medium text-white shadow-none hover:brightness-105 hover:-translate-y-px transition-all"
            style={{ backgroundColor: themeColor }}
          >
            Evet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomMessageBox;
