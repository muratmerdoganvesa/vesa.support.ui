import { CrmModulDto } from "api/generated";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { type CrmModulSubItemEntry } from "../utils";
import {
  CrmListTableHeader,
  LIST_TABLE_COLUMN_COUNT,
} from "./crmOpportunityRowShared";
import { CrmModulListEmpty } from "./CrmModulListEmpty";
import { CrmModulListPagination } from "./CrmModulListPagination";
import { CrmModulListRow } from "./CrmModulListRow";

export type { CrmModulSubItemEntry };

type CrmModulTableProps = {
  entries: CrmModulSubItemEntry[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allCount: number;
  onPageChange: (page: number) => void;
  onEdit: (row: CrmModulDto) => void;
};

export const CrmModulTable = ({
  entries,
  currentPage,
  totalPages,
  totalCount,
  allCount,
  onPageChange,
  onEdit,
}: CrmModulTableProps) => (
  <>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <CrmListTableHeader />
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={LIST_TABLE_COLUMN_COUNT}>
                <CrmModulListEmpty />
              </TableCell>
            </TableRow>
          ) : (
            entries.map(({ parent, item, key }) => (
              <CrmModulListRow
                key={key}
                parent={parent}
                item={item}
                onEdit={() => onEdit(parent)}
              />
            ))
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
