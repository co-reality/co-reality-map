import { writeToString } from "@fast-csv/format";
import { User } from "types/User";
import { WithId } from "./id";

const downloadCSVFile = (csvContent: string) => {
  const url = URL.createObjectURL(new Blob([csvContent], { type: "text/csv" }));
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    "users_report_" + new Date().getTime() + ".csv"
  );
  link.click();
  URL.revokeObjectURL(url);
};

const generateUserCSV = async (
  rows: readonly WithId<User>[],
  headers: string[]
) => {
  return await writeToString([...rows], {
    headers: headers,
    quote: true,
  });
};

export const downloadGeneratedCSVFileUsers = async (
  rows: readonly WithId<User>[],
  headers: string[]
) => {
  downloadCSVFile(await generateUserCSV(rows, headers));
};
