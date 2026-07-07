/**
 * Tests for src/lib/s3.ts
 *
 * Verifies S3 client configuration and upload/download functions.
 */

// Mock @aws-sdk/client-s3
const mockSend = jest.fn();
const mockS3Client = jest.fn().mockImplementation(() => ({
  send: mockSend,
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: mockS3Client,
  PutObjectCommand: jest.fn().mockImplementation((params) => ({
    type: 'PutObjectCommand',
    ...params,
  })),
  GetObjectCommand: jest.fn().mockImplementation((params) => ({
    type: 'GetObjectCommand',
    ...params,
  })),
}));

describe('s3 client', () => {
  beforeEach(() => {
    jest.resetModules();
    mockSend.mockClear();
    mockS3Client.mockClear();
    delete (globalThis as any).s3;
  });

  it('creates an S3Client instance', () => {
    const { s3 } = require('@/lib/s3');
    expect(s3).toBeDefined();
    expect(mockS3Client).toHaveBeenCalledTimes(1);
  });

  it('configures S3Client with endpoint and credentials', () => {
    require('@/lib/s3');
    expect(mockS3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.any(String),
        region: expect.any(String),
        credentials: expect.objectContaining({
          accessKeyId: expect.any(String),
          secretAccessKey: expect.any(String),
        }),
        forcePathStyle: true,
      })
    );
  });

  it('returns same instance on subsequent imports (singleton)', () => {
    const { s3: s1 } = require('@/lib/s3');
    const { s3: s2 } = require('@/lib/s3');
    expect(s1).toBe(s2);
    expect(mockS3Client).toHaveBeenCalledTimes(1);
  });
});

describe('uploadToS3', () => {
  beforeEach(() => {
    jest.resetModules();
    mockSend.mockClear();
    delete (globalThis as any).s3;
  });

  it('calls PutObjectCommand with correct params', async () => {
    mockSend.mockResolvedValueOnce({});
    const { uploadToS3 } = require('@/lib/s3');

    await uploadToS3('test-key', Buffer.from('test-content'), 'text/plain');

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PutObjectCommand',
        Key: 'test-key',
        Body: expect.any(Buffer),
        ContentType: 'text/plain',
      })
    );
  });

  it('returns the S3 URL', async () => {
    mockSend.mockResolvedValueOnce({});
    const { uploadToS3 } = require('@/lib/s3');

    const result = await uploadToS3('test-key', Buffer.from('content'));

    expect(result).toContain('test-key');
  });
});

describe('getFromS3', () => {
  beforeEach(() => {
    jest.resetModules();
    mockSend.mockClear();
    delete (globalThis as any).s3;
  });

  it('calls GetObjectCommand with correct key', async () => {
    const mockBody = {
      transformToString: jest.fn().mockResolvedValue('file-content'),
    };
    mockSend.mockResolvedValueOnce({ Body: mockBody });
    const { getFromS3 } = require('@/lib/s3');

    const result = await getFromS3('test-key');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GetObjectCommand',
        Key: 'test-key',
      })
    );
    expect(result).toBe('file-content');
  });
});