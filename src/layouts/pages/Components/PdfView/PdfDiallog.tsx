import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { X } from "lucide-react";

interface PdfDialogProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

const PdfDialog: React.FC<PdfDialogProps> = ({ open, onClose, pdfUrl, title }) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-3xl w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-5 py-4 border-b">
          <DialogTitle className="text-base font-semibold leading-none">
            {title}
          </DialogTitle>
          <button
            aria-label="Kapat"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        <div className="w-full">
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            style={{ border: "none", display: "block" }}
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfDialog;
