import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_COLUMNS } from "settings";

import { Table } from "types/Table";

export interface GenerateTablesProps {
  num: number;
  capacity: number;
  rows?: number;
  columns?: number;
  titlePrefix?: string;
  appendTableNumber?: boolean;
  startFrom?: number;
  subtitle?: string;
  makeReference?: (props: Omit<GenerateTablesProps, "makeReference">) => string;
}

/**
 * Generate an array of Table configs that can be used with Jazz Bar/similar.
 *
 * @param num number of tables to create
 * @param capacity how many people can sit at each table
 * @param rows how many rows will the seats be displayed across for each table
 * @param columns how many columns will the seats be displayed across for each table
 * @param titlePrefix what should the tables be called (will have the table number appended to it)
 * @param appendTableNumber whether to append the table number to the title or not
 * @param startFrom what number should we start from when generating table numbers in the title
 * @param subtitle what should the tables subtitle be
 */
export const generateTables = (props: GenerateTablesProps): Table[] => {
  const {
    num,
    capacity,
    rows = DEFAULT_TABLE_ROWS,
    columns = DEFAULT_TABLE_COLUMNS,
    titlePrefix = "Table",
    appendTableNumber = true,
    startFrom = 1,
    subtitle,
  } = props;

  return Array.from(Array(num)).map((_, idx) => {
    const tableNumber = startFrom + idx;

    const title = appendTableNumber
      ? `${titlePrefix} ${tableNumber}`
      : titlePrefix;

    const reference = props.makeReference?.(props) ?? title;

    return {
      title,
      subtitle,
      reference,
      capacity,
      rows,
      columns,
    };
  });
};
