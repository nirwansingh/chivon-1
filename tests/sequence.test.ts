import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DocumentNumberService } from '../lib/sequence';
import { prisma } from '../lib/prisma';

describe('DocumentNumberService (T-08)', () => {
  beforeAll(async () => {
    // Clear out test sequences before running
    await prisma.documentSequence.deleteMany({
      where: { prefix: 'TEST' }
    });
  });

  afterAll(async () => {
    await prisma.documentSequence.deleteMany({
      where: { prefix: 'TEST' }
    });
    await prisma.$disconnect();
  });

  it('should generate sequence numbers sequentially', async () => {
    const num1 = await DocumentNumberService.generateNextNumber('TEST');
    const num2 = await DocumentNumberService.generateNextNumber('TEST');
    
    expect(num1).toMatch(/^TEST-\d{8}-0001$/);
    expect(num2).toMatch(/^TEST-\d{8}-0002$/);
  });

  it('should generate unique numbers under concurrent requests (concurrency test)', async () => {
    const numRequests = 50;
    const promises = Array.from({ length: numRequests }, () => 
      DocumentNumberService.generateNextNumber('TEST')
    );

    const results = await Promise.all(promises);
    
    // Check for duplicates
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(numRequests);
  });
});
