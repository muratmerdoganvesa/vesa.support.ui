import { CrmModulDto, CrmSubItemDto } from "api/generated";
import { TableCell, TableRow } from "components/ui/table";
import { formatCrmUpdatedBy, formatDateTimeTr, formatSolutionModuleNames, resolvePartnerCompanyName } from "../utils";
import {
  formatSubItemTotal,
  PipelineStageBadge,
} from "./crmOpportunityRowShared";
import { CrmModulRowActions } from "./CrmModulRowActions";

type CrmModulListRowProps = {
  parent: CrmModulDto;
  item: CrmSubItemDto;
  onEdit: () => void;
};

export const CrmModulListRow = ({ parent, item, onEdit }: CrmModulListRowProps) => {
  const companyName = parent.companyName?.trim() || "—";
  const partnerName = resolvePartnerCompanyName(parent);
  const accountManager = parent.accountManager?.trim() || "—";
  const moduleName = formatSolutionModuleNames(item.solutionModuleNames);

  return (
    <TableRow className="border-b border-slate-100 hover:bg-indigo-50/20">
      <TableCell className="px-2 py-3">
        <CrmModulRowActions onEdit={onEdit} size="sm" />
      </TableCell>
      <TableCell className="px-4 py-3 text-sm font-semibold whitespace-nowrap text-slate-800">
        {companyName}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-600">
        {partnerName}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-600">
        {accountManager}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm font-medium whitespace-nowrap text-slate-700">
        {moduleName}
      </TableCell>
      <TableCell className="px-4 py-3 text-center text-sm tabular-nums whitespace-nowrap text-slate-700">
        {item.personCount != null && item.personCount > 0 ? item.personCount : "—"}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm font-semibold tabular-nums whitespace-nowrap text-slate-900">
        {formatSubItemTotal(item)}
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-nowrap">
        <PipelineStageBadge stage={item.opportunityStage} />
      </TableCell>
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-700 tabular-nums">
        {formatDateTimeTr(parent.updatedDate)}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm font-medium whitespace-nowrap text-indigo-700">
        {formatCrmUpdatedBy(parent.updatedBy)}
      </TableCell>
    </TableRow>
  );
};
