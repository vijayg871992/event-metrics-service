import { FastifyReply, FastifyRequest } from "fastify";
import { EventModel } from "../models/Event";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import { BatchModel } from "../models/Batch";
import { parseCSV } from '../utils/csvParser';

export async function handleUpload(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const mp = await request.file();
  if (!mp) return reply.code(400).send({ error: "CSV file required" });

  const batchId = uuidv4();
  const inserted: string[] = [];
  const errors: any[] = [];
  const required = ["candidate_id", "test_id", "event_type", "timestamp"];
  const stream = mp.file as Readable;
  const rows = await parseCSV(stream);

  for (const [i, row] of rows.entries()) {
    let shouldSkip = false;

    // Step 1: Validation
    for (const field of required) {
      if (!row[field]) {
        const reason = `Missing field: ${field}`;
        request.log.warn(`Row ${i + 1} skipped: ${reason}`);
        errors.push({ row: i + 1, ...row, error_reason: reason });
        shouldSkip = true;
        break;
      }
    }

    // Step 2: Skip DB insert if validation failed
    if (shouldSkip) continue;

    // Step 3: Try inserting only valid rows
    try {
      const doc = await EventModel.create({
        event_id: uuidv4(),
        batch_id: batchId,
        candidate_id: row.candidate_id,
        test_id: row.test_id,
        event_type: row.event_type,
        timestamp: new Date(row.timestamp),
        processed: false,
        created_at: new Date(),
      });
      inserted.push(doc.event_id);
    } catch (err: any) {
      const reason =
        err.code === 11000
          ? "Duplicate entry skipped"
          : "Database insert error";
      request.log.error(`Row ${i + 1} skipped: ${reason}`);
      errors.push({ row: i + 1, ...row, error_reason: reason });
    }
  }

  request.log.info(`Batch ${batchId}: ${inserted.length} records inserted`);

  // Create a batch record for tracking
  await BatchModel.create({
    batch_id: batchId,
    file_name: mp.filename,
    total_events: inserted.length,
    status: "uploaded",
  });

  return reply.code(201).send({
    batch_id: batchId,
    inserted_count: inserted.length,
    failed_count: errors.length,
    errors,
  });
}
