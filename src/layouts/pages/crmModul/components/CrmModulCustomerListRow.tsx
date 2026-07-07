import { CrmModulDto } from "api/generated";
import { TableCell, TableRow } from "components/ui/table";
import { getLeadSourceLabel } from "../constants";
import {
  formatCrmUpdatedBy,
  formatDateTimeTr,
  formatPhoneNumberTr,
  resolveCompanyName,
  resolvePartnerCompanyName,
} from "../utils";
import { CrmModulRowActions } from "./CrmModulRowActions";

type CrmModulCustomerListRowProps = {
  row: CrmModulDto;
  onEdit: () => void;
};

export const CrmModulCustomerListRow = ({ row, onEdit }: CrmModulCustomerListRowProps) => {
  const companyName = resolveCompanyName(row);
  const partnerName = resolvePartnerCompanyName(row);
  const contact =
    [row.contactPerson?.trim(), row.contactTitle?.trim()].filter(Boolean).join(" · ") || "—";
  const phone = row.phoneNumber?.trim() ? formatPhoneNumberTr(row.phoneNumber) : "—";
  const leadLabel = getLeadSourceLabel(row.leadSource);
  const opportunityCount = row.crmSubItems?.length ?? 0;
  const accountManager = row.accountManager?.trim() || "—";

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
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-700 max-w-[160px] truncate" title={contact}>
        {contact}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-600 font-mono text-xs">
        {phone}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-600">
        {leadLabel !== "—" ? leadLabel : "—"}
      </TableCell>
      <TableCell className="px-4 py-3 text-center text-sm tabular-nums whitespace-nowrap text-slate-700">
        {opportunityCount > 0 ? opportunityCount : "—"}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-700">
        {accountManager}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-slate-700 tabular-nums">
        {formatDateTimeTr(row.updatedDate)}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm font-medium whitespace-nowrap text-indigo-700">
        {formatCrmUpdatedBy(row.updatedBy)}
      </TableCell>
    </TableRow>
  );
};
