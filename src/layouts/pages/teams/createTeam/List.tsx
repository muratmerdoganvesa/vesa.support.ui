import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import { cn } from "lib/utils";

export interface ProfileDto {
  image?: string;
  name: string;
  description: string;
  id: string;
}

function ProfilesList({
  title,
  profiles,
  shadow = true,
  onDelete,
}: {
  title: string;
  profiles: ProfileDto[];
  shadow?: boolean;
  onDelete: (id: string) => void;
}) {
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const initials = (name: string) =>
    name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleOpenQuestionBox = (id: string) => {
    setSelectedProfileId(id);
    setIsQuestionOpen(true);
  };

  const handleCloseQuestionBox = () => setIsQuestionOpen(false);

  const handleConfirmDelete = () => {
    if (selectedProfileId) {
      onDelete(selectedProfileId);
    }
    setSelectedProfileId(null);
    setIsQuestionOpen(false);
  };

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border-slate-100 bg-white",
          shadow ? "shadow-sm shadow-slate-100/80" : "shadow-none ring-1 ring-border/40"
        )}
      >
        <CardHeader className="border-b border-slate-100/80 pb-3">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-800">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul
            role="list"
            className="max-h-64 divide-y divide-slate-100 overflow-y-auto px-3 py-2 sm:w-full sm:max-w-xl"
          >
            {profiles.map(({ image, name, description, id }) => (
              <li
                key={id}
                className="group flex items-center justify-between gap-4 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="size-10 shrink-0 ring-2 ring-white shadow-sm shadow-slate-200/70">
                    {image ? (
                      <AvatarImage
                        src={`data:image/png;base64,${image}`}
                        alt=""
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-indigo-100 text-xs font-medium text-indigo-700">
                        {initials(name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium leading-tight text-slate-900">
                      {name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-slate-400 opacity-80 transition-colors hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                  onClick={() => handleOpenQuestionBox(id)}
                  aria-label="Üyeyi çıkar"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog open={isQuestionOpen} onOpenChange={setIsQuestionOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Üyeyi kaldır</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Bu kişiyi ekipten çıkarmak istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              type="button"
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={handleCloseQuestionBox}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
              onClick={handleConfirmDelete}
            >
              Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ProfilesList;
