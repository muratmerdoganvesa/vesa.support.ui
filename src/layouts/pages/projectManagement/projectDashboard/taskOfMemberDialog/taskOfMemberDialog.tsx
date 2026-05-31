import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Badge } from "components/ui/badge";
import { Separator } from "components/ui/separator";
import { CheckCircle2, ClipboardList } from "lucide-react";

interface TaskOfMemberDialogProps {
  open: boolean;
  onClose: () => void;
  task: string[];
  memberName?: string;
}

function TaskOfMemberDialog({
  open,
  onClose,
  task,
  memberName = "",
}: TaskOfMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-0 overflow-hidden rounded-xl p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
            {memberName ? `${memberName} — Tasks` : "Tasks"}
          </DialogTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {task.length > 0
              ? `Seçili projede kullanıcıya atanan görevler (${task.length} task)`
              : "Bu kullanıcıya atanmış görev bulunmamaktadır."}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {task.length > 0 ? (
            <ul className="space-y-0" role="list">
              {task.map((taskItem, index) => (
                <li key={index}>
                  {index > 0 && <Separator className="opacity-60" />}
                  <div className="flex items-center gap-3 py-3 transition-colors hover:bg-accent/50 rounded-lg px-2 -mx-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <ClipboardList className="size-4 text-primary" aria-hidden />
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {taskItem}
                    </span>
                    <Badge
                      className="shrink-0 gap-1 bg-emerald-500 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="size-3" aria-hidden />
                      Atandı
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/40 py-12 text-center">
              <ClipboardList
                className="size-14 text-muted-foreground/30"
                strokeWidth={1.2}
                aria-hidden
              />
              <p className="text-sm text-muted-foreground">
                Bu kullanıcıya atanmış görev bulunmamaktadır.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Kullanıcıya görev atamak için Gantt Chart sayfasını kullanabilirsiniz.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-muted/30 px-6 py-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            tabIndex={0}
            aria-label="Dialogu kapat"
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TaskOfMemberDialog;
