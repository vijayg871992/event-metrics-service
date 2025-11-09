import csvParser from 'csv-parser';
import { Readable } from 'stream';

//CSv to Array
export async function parseCSV(stream: Readable): Promise<any[]> {
  const rows: any[] = [];

  return new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}
