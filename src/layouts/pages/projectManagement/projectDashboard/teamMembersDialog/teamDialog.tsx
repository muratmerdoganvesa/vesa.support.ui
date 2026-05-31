import { useState } from "react";

import { ProjectTasksApi, UserAppDto } from "api/generated";
import getConfiguration from "confiuration";

import { cn } from "lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Separator } from "components/ui/separator";
import { ChevronLeft, ChevronRight, Info, Mail, Users } from "lucide-react";
import TaskOfMemberDialog from "../taskOfMemberDialog/taskOfMemberDialog";

interface TeamDialogProps {
  open: boolean;
  onClose: () => void;
  teamMembers: UserAppDto[];
  selectedProjectId: string;
  handlePageChange: (page: number) => void;
}

function TeamDialog({
  open,
  onClose,
  teamMembers,
  selectedProjectId,
  handlePageChange,
}: TeamDialogProps) {
  const [openTaskOfMemberDialog, setOpenTaskOfMemberDialog] = useState(false);
  const [taskOfMember, setTaskOfMember] = useState<string[]>([]);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleOpenTaskOfMemberDialog = async (memberId: string) => {
    try {
      const config = getConfiguration();
      const projectApi = new ProjectTasksApi(config);
      const response = await projectApi.apiProjectTasksGetTasksByUserGet(
        memberId,
        selectedProjectId,
      );
      setTaskOfMember(response.data);

      const member = teamMembers.find((m) => m.id === memberId);
      setSelectedMemberName(
        member ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() : "",
      );

      setOpenTaskOfMemberDialog(true);
    } catch (e) {
      console.log(e);
    }
  };

  const getInitials = (member: UserAppDto) =>
    `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <Users className="size-4 text-muted-foreground" aria-hidden />
              Ekip Üyeleri
            </DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Projede çalışan ekip üyeleri listesi
            </p>
          </DialogHeader>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {teamMembers.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.id ?? index}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:items-center"
                  >
                    {/* Avatar + name */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="size-12 shrink-0">
                        <AvatarImage
                          src={
                            member.photo
                              ? `data:image/jpeg;base64,${member.photo}`
                              : undefined
                          }
                          alt={`${member.firstName ?? ""} ${member.lastName ?? ""}`}
                        />
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {member.firstName} {member.lastName}
                          </span>
                          <button
                            type="button"
                            tabIndex={0}
                            aria-label={`${member.firstName} görevlerini görüntüle`}
                            onClick={() => handleOpenTaskOfMemberDialog(member.id)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleOpenTaskOfMemberDialog(member.id)
                            }
                            className="shrink-0 rounded p-0.5 text-muted-foreground/60 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Info className="size-3.5" aria-hidden />
                          </button>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{member.userName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chips */}
                    {(member.sapDepartmentText || member.sapPositionText) && (
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        {member.sapDepartmentText && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {member.sapDepartmentText}
                          </Badge>
                        )}
                        {member.sapPositionText && (
                          <Badge
                            variant="outline"
                            className="max-w-[200px] whitespace-normal text-xs font-normal"
                          >
                            {member.sapPositionText}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Users className="size-12 text-muted-foreground/30" strokeWidth={1.2} aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Bu projede henüz ekip üyesi bulunmamaktadır.
                </p>
              </div>
            )}

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => {
                  handlePageChange(currentPage - 1);
                  setCurrentPage((p) => p - 1);
                }}
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <span className="text-xs text-muted-foreground">Sayfa {currentPage}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={teamMembers.length < 5}
                onClick={() => {
                  handlePageChange(currentPage + 1);
                  setCurrentPage((p) => p + 1);
                }}
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TaskOfMemberDialog
        open={openTaskOfMemberDialog}
        onClose={() => setOpenTaskOfMemberDialog(false)}
        task={taskOfMember}
        memberName={selectedMemberName}
      />
    </>
  );
}

export default TeamDialog;
