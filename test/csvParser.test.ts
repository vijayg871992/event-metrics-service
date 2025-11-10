import { parseCSV } from '../src/utils/csvParser';
import { Readable } from 'stream';

describe('CSV Parser', () => {
  it('should parse valid CSV data', async () => {
    const csvData = `candidate_id,test_id,event_type,timestamp
C101,T1001,test_started,2025-11-10T10:00:00Z
C102,T1002,test_completed,2025-11-10T11:00:00Z`;

    const stream = Readable.from([csvData]);
    const rows = await parseCSV(stream);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveProperty('candidate_id', 'C101');
    expect(rows[0]).toHaveProperty('event_type', 'test_started');
  });

  it('should handle empty CSV', async () => {
    const csvData = `candidate_id,test_id,event_type,timestamp`;
    const stream = Readable.from([csvData]);
    const rows = await parseCSV(stream);

    expect(rows).toHaveLength(0);
  });
});