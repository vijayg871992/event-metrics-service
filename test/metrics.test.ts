import { EventModel } from '../src/models/Event';
import { DailyMetricsModel } from '../src/models/DailyMetrics';
import { v4 as uuidv4 } from 'uuid';

describe('Metrics Computation', () => {
  beforeEach(async () => {
    await EventModel.deleteMany({});
    await DailyMetricsModel.deleteMany({});
  });

  it('should compute daily metrics correctly', async () => {
    const batchId = uuidv4();
    const date = '2025-11-10';

    await EventModel.create([
      {
        event_id: uuidv4(),
        batch_id: batchId,
        candidate_id: 'C101',
        test_id: 'T1001',
        event_type: 'test_started',
        timestamp: new Date(`${date}T10:00:00Z`),
        processed: true,
      },
      {
        event_id: uuidv4(),
        batch_id: batchId,
        candidate_id: 'C101',
        test_id: 'T1001',
        event_type: 'test_started',
        timestamp: new Date(`${date}T11:00:00Z`),
        processed: true,
      },
      {
        event_id: uuidv4(),
        batch_id: batchId,
        candidate_id: 'C102',
        test_id: 'T1002',
        event_type: 'test_completed',
        timestamp: new Date(`${date}T12:00:00Z`),
        processed: true,
      },
    ]);

    const events = await EventModel.find({ processed: true });
    const metricsMap: Record<string, Record<string, number>> = {};

    for (const e of events) {
      const eventDate = new Date(e.timestamp).toISOString().split('T')[0];
      const type = e.event_type;

      if (!metricsMap[eventDate]) metricsMap[eventDate] = {};
      if (!metricsMap[eventDate][type]) metricsMap[eventDate][type] = 0;
      metricsMap[eventDate][type]++;
    }

    expect(metricsMap[date]).toBeDefined();
    expect(metricsMap[date]['test_started']).toBe(2);
    expect(metricsMap[date]['test_completed']).toBe(1);
  });

  it('should store metrics in database', async () => {
    const date = '2025-11-10';
    const metrics = [
      { event_type: 'test_started', count: 5 },
      { event_type: 'test_completed', count: 3 },
    ];

    await DailyMetricsModel.create({ date, metrics });

    const stored = await DailyMetricsModel.findOne({ date });
    expect(stored).toBeDefined();
    expect(stored?.metrics).toHaveLength(2);
    expect(stored?.metrics[0].count).toBe(5);
  });

  it('should update existing metrics', async () => {
    const date = '2025-11-10';
    const initialMetrics = [{ event_type: 'test_started', count: 5 }];

    await DailyMetricsModel.create({ date, metrics: initialMetrics });

    const updatedMetrics = [
      { event_type: 'test_started', count: 7 },
      { event_type: 'test_completed', count: 2 },
    ];

    await DailyMetricsModel.findOneAndUpdate(
      { date },
      { $set: { metrics: updatedMetrics } },
      { upsert: true, new: true }
    );

    const result = await DailyMetricsModel.findOne({ date });
    expect(result?.metrics).toHaveLength(2);
    expect(result?.metrics[0].count).toBe(7);
  });
});