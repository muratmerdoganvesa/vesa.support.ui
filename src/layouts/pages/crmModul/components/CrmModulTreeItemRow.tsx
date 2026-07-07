import { CrmSubItemDto } from "api/generated";
import { TableCell, TableRow } from "components/ui/table";
import { CornerDownRight } from "lucide-react";
import { cn } from "lib/utils";
import { formatSolutionModuleNames, resolveSubItemDisplayTitle } from "../utils";
import {
  formatSubItemTotal,
  PipelineStageBadge,
} from "./crmOpportunityRowShared";

type CrmModulTreeItemRowProps = {
  item: CrmSubItemDto;
  isLast?: boolean;
};

export const CrmModulTreeItemRow = ({ item, isLast = false }: CrmModulTreeItemRowProps) => {
  const moduleName = formatSolutionModuleNames(item.solutionModuleNames);
  const title = resolveSubItemDisplayTitle(item);

  return (
    <TableRow
      className={cn(
        "border-b border-slate-100 bg-white hover:bg-slate-50/80",
        isLast && "border-b-indigo-100"
      )}
    >
      <TableCell className="px-2 py-2.5" />
      <TableCell className="px-4 py-2.5" />
      <TableCell className="px-4 py-2.5" />
      <TableCell className="px-4 py-2.5 pl-6">
        <div className="flex min-w-[100px] items-center gap-2">
          <CornerDownRight className="size-3.5 shrink-0 text-indigo-400" />
          <span className="text-sm font-medium whitespace-nowrap text-slate-700" title={title}>
            {title}
          </span>
          {moduleName !== "—" && title !== moduleName && (
            <span className="text-xs text-slate-400 truncate max-w-[120px]" title={moduleName}>
              ({moduleName})
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-2.5 text-center text-sm tabular-nums whitespace-nowrap text-slate-700">
        {item.personCount != null && item.personCount > 0 ? item.personCount : "—"}
      </TableCell>
      <TableCell className="px-4 py-2.5 text-sm font-semibold tabular-nums whitespace-nowrap text-slate-900">
        {formatSubItemTotal(item)}
      </TableCell>
      <TableCell className="px-4 py-2.5 whitespace-nowrap">
        <PipelineStageBadge stage={item.opportunityStage} />
      </TableCell>
    </TableRow>
  );
};
