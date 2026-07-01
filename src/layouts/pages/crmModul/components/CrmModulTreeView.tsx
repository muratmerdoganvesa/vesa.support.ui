import { CrmModulDto } from "api/generated";
import { Badge } from "components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Building2, CornerDownRight } from "lucide-react";
import { Fragment } from "react";
import { getLeadSourceLabel } from "../constants";
import { resolveCompanyName, resolvePartnerCompanyName } from "../utils";
import {
  CrmOpportunityTableHeader,
  OPPORTUNITY_TABLE_COLUMN_COUNT,
} from "./crmOpportunityRowShared";
import { CrmModulListEmpty } from "./CrmModulListEmpty";
import { CrmModulListPagination } from "./CrmModulListPagination";
import { CrmModulRowActions } from "./CrmModulRowActions";
import { CrmModulTreeItemRow } from "./CrmModulTreeItemRow";

type CrmModulTreeViewProps = {
  rows: CrmModulDto[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allCount: number;
  onPageChange: (page: number) => void;
  onEdit: (row: CrmModulDto) => void;
};

const CompanyHeaderRow = ({
  row,
  onEdit,
  subItemCount,
}: {
  row: CrmModulDto;
  onEdit: () => void;
  subItemCount: number;
}) => {
  const companyName = resolveCompanyName(row);
  const partnerName = resolvePartnerCompanyName(row);

  return (
    <TableRow className="border-b border-indigo-100 bg-indigo-50/60 hover:bg-indigo-50/80">
      <TableCell className="px-2 py-2.5">
        <CrmModulRowActions onEdit={onEdit} size="sm" />
      </TableCell>
      <TableCell className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 shrink-0 text-indigo-600" />
          <span className="text-sm font-semibold whitespace-nowrap text-slate-800">{companyName}</span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-2.5 text-sm whitespace-nowrap text-slate-600">
        {partnerName}
      </TableCell>
      <TableCell className="px-4 py-2.5" colSpan={4}>
        <div className="flex flex-wrap items-center gap-2">
          {subItemCount > 0 && (
            <Badge variant="outline" className="border-indigo-200 bg-white text-xs font-normal text-indigo-700">
              {subItemCount} fırsat
            </Badge>
          )}
          <Badge variant="outline" className="border-slate-200 bg-white text-xs font-normal">
            {getLeadSourceLabel(row.leadSource)}
          </Badge>
          {row.contactPerson && (
            <span className="text-xs text-slate-600">{row.contactPerson}</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

const EmptySubItemRow = () => (
  <TableRow className="border-b border-indigo-100 bg-white hover:bg-slate-50/80">
    <TableCell className="px-2 py-2.5" />
    <TableCell colSpan={OPPORTUNITY_TABLE_COLUMN_COUNT - 1} className="px-4 py-2.5 pl-6 text-sm italic text-slate-400">
      <div className="flex items-center gap-2">
        <CornerDownRight className="size-3.5 text-slate-300" />
        Henüz fırsat eklenmemiş
      </div>
    </TableCell>
  </TableRow>
);

export const CrmModulTreeView = ({
  rows,
  currentPage,
  totalPages,
  totalCount,
  allCount,
  onPageChange,
  onEdit,
}: CrmModulTreeViewProps) => (
  <>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <CrmOpportunityTableHeader />
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={OPPORTUNITY_TABLE_COLUMN_COUNT}>
                <CrmModulListEmpty />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const subItems = row.crmSubItems ?? [];

              return (
                <Fragment key={row.id}>
                  <CompanyHeaderRow
                    row={row}
                    subItemCount={subItems.length}
                    onEdit={() => onEdit(row)}
                  />
                  {subItems.length === 0 ? (
                    <EmptySubItemRow />
                  ) : (
                    subItems.map((item, index) => (
                      <CrmModulTreeItemRow
                        key={item.id ?? `${row.id}-sub-${index}`}
                        item={item}
                        isLast={index === subItems.length - 1}
                      />
                    ))
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>

    <CrmModulListPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      allCount={allCount}
      onPageChange={onPageChange}
    />
  </>
);
