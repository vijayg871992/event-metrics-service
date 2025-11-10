import { EventModel } from '../src/models/Event';
import { BatchModel } from '../src/models/Batch';
import { DailyMetricsModel } from '../src/models/DailyMetrics';
import { v4 as uuidv4 } from 'uuid';

describe('Happy Path Integration Test', () => {
  beforeEach(async () => {
    await EventModel.deleteMany({});
    await BatchModel.deleteMany({});
    await DailyMetricsModel.deleteMany({});
  });

  it('should complete full workflow: create events -> process -> verify metrics', async () => {
    const batchId = uuidv4();
    const date = '2025-11-10';

    // Step 1: Create batch and events (simulating upload)
    await BatchModel.create({
      batch_id: batchId,
      file_name: 'test.csv',
      total_events: 3,
      status: 'uploaded',
    });

    await EventModel.create([
      {
        event_id: uuidv4(),
        batch_id: batchId,
        candidate_id: 'C101',
        test_id: 'T1001',
        event_type: 'test_started',
        timestamp: new Date(`${date}T10:00:00Z`),
        processed: false,
      },
      {
        event_id: uuidv4(),
        batch_id: batchId,
        candidate_id: 'C101',
        test_id: 'T1001',
        event_type: 'test_completed',
        timestamp: new Date(`${date}T10:30:00Z`),
        processed: false,
      },
      {
        event_id: uuidv4(),
        batch_id: batchId,
        candidate_id: 'C102',
        test_id: 'T1002',
        event_type: 'test_started',
        timestamp: new Date(`${date}T11:00:00Z`),
        processed: false,
      },
    ]);

    // Step 2: Process batch (simulating eventJob)
    const events = await EventModel.find({ batch_id: batchId });
    const metricsMap: Record<string, Record<string, number>> = {};

    for (const e of events) {
      const eventDate = new Date(e.timestamp).toISOString().split('T')[0];
      const type = e.event_type;
      if (!metricsMap[eventDate]) metricsMap[eventDate] = {};
      if (!metricsMap[eventDate][type]) metricsMap[eventDate][type] = 0;
      metricsMap[eventDate][type]++;
    }

    for (const [d, types] of Object.entries(metricsMap)) {
      const metrics = Object.entries(types).map(([event_type, count]) => ({ event_type, count }));
      await DailyMetricsModel.findOneAndUpdate(
        { date: d },
        { $set: { metrics } },
        { upsert: true, new: true }
      );
    }

    await EventModel.updateMany({ batch_id: batchId }, { processed: true });
    await BatchModel.updateOne({ batch_id: batchId }, { status: 'completed' });

    // Step 3: Verify results
    const batch = await BatchModel.findOne({ batch_id: batchId });
    expect(batch?.status).toBe('completed');

    const processedEvents = await EventModel.find({ batch_id: batchId });
    expect(processedEvents.every((e) => e.processed)).toBe(true);

    const dailyMetrics = await DailyMetricsModel.findOne({ date });
    expect(dailyMetrics?.metrics).toHaveLength(2);
    expect(dailyMetrics?.metrics.find((m) => m.event_type === 'test_started')?.count).toBe(2);
    expect(dailyMetrics?.metrics.find((m) => m.event_type === 'test_completed')?.count).toBe(1);
  });
});