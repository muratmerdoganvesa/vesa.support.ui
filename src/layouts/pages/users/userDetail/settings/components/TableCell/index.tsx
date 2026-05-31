import { ReactNode } from "react";
import { cn } from "lib/utils";

interface Props {
  width?: string;
  children: ReactNode;
  align?: string;
  padding?: number[];
  noBorder?: boolean;
}

function TableCell({
  width = "auto",
  align = "left",
  padding = [],
  noBorder = false,
  children,
}: Props): JSX.Element {
  const [pt = 0, pr = 0, pb = 0, pl = 0] = padding;

  return (
    <th
      style={{
        width,
        textAlign: align as React.CSSProperties["textAlign"],
        paddingTop: `${pt * 0.25}rem`,
        paddingRight: `${pr * 0.25}rem`,
        paddingBottom: `${pb * 0.25}rem`,
        paddingLeft: `${pl * 0.25}rem`,
      }}
      className={cn("text-sm font-normal text-gray-700", !noBorder && "border border-gray-200")}
    >
      <div>{children}</div>
    </th>
  );
}

export default TableCell;
