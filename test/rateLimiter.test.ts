import { checkUploadRate } from '../src/utils/rateLimiter';
import { createClient } from 'redis';

jest.mock('redis', () => {
  const mockClient = {
    incr: jest.fn(),
    expire: jest.fn(),
    connect: jest.fn(),
  };
  return {
    createClient: jest.fn(() => mockClient),
  };
});

describe('Rate Limiter', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = createClient();
    jest.clearAllMocks();
  });

  it('should allow first upload from IP', async () => {
    mockRedis.incr.mockResolvedValue(1);

    const result = await checkUploadRate('192.168.1.1');

    expect(result).toBe(true);
    expect(mockRedis.incr).toHaveBeenCalledWith('upload_rate:192.168.1.1');
    expect(mockRedis.expire).toHaveBeenCalled();
  });

  it('should block second upload within window', async () => {
    mockRedis.incr.mockResolvedValue(2);

    const result = await checkUploadRate('192.168.1.1');

    expect(result).toBe(false);
  });
});