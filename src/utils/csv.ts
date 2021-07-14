import { createReadStream } from "fs";
import neatCsv from "neat-csv";

type RawCSVData = {
  [key: string]: string;
};

export const getCSVRows = async (filePath: string) => {
  let results: RawCSVData[] = [];
  const file = await createReadStream(filePath);
  results = await neatCsv(file);
  return results;
};
