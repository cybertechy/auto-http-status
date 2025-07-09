#!/usr/bin/env node

/**
 * Performance test script for auto-http-status
 * Tests the library's performance with various inputs
 */

import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadLibrary() {
  try {
    // Use file:// URL for Windows compatibility
    const distPath = new URL('../dist/index.js', import.meta.url);
    const { autoHttpStatus } = await import(distPath);
    return { getStatus: autoHttpStatus.getStatus.bind(autoHttpStatus) };
  } catch (error) {
    console.log('Could not load from dist:', error.message);
    throw new Error('Build the project first with: npm run build');
  }
}

async function runPerformanceTests() {
  console.log('🚀 Running performance tests...\n');
  
  const lib = await loadLibrary();
  const { getStatus } = lib;
  
  // Test scenarios
  const testCases = [
    { name: 'Direct status code', input: { status: 404 }, expected: 404 },
    { name: 'Error mapping', input: new TypeError('Invalid type'), expected: 400 },
    { name: 'Keyword matching', input: new Error('Not found'), expected: 404 },
    { name: 'Context-aware POST', input: { id: 1 }, context: { method: 'POST' }, expected: 201 },
    { name: 'Context-aware GET', input: null, context: { method: 'GET', params: { id: '123' } }, expected: 404 },
    { name: 'Simple data', input: { data: 'test' }, expected: 200 },
    { name: 'Validation error', input: new Error('Validation failed'), expected: 400 },
    { name: 'Authorization error', input: new Error('Unauthorized access'), expected: 401 },
  ];
  
  const iterations = 1000;
  let totalTime = 0;
  let successCount = 0;
  let failureDetails = {};
  
  console.log(`Testing ${testCases.length} scenarios with ${iterations} iterations each...\n`);
  
  for (const testCase of testCases) {
    const start = performance.now();
    let caseSuccessCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      try {
        const result = await getStatus(testCase.input, testCase.context);
        if (result === testCase.expected) {
          successCount++;
          caseSuccessCount++;
        } else {
          // Track failures for debugging
          if (!failureDetails[testCase.name]) {
            failureDetails[testCase.name] = { expected: testCase.expected, actual: result, count: 0 };
          }
          failureDetails[testCase.name].count++;
        }
      } catch (error) {
        console.error(`Error in test case "${testCase.name}":`, error.message);
      }
    }
    
    const end = performance.now();
    const duration = end - start;
    totalTime += duration;
    
    const caseSuccessRate = (caseSuccessCount / iterations * 100).toFixed(1);
    console.log(`${testCase.name}: ${duration.toFixed(2)}ms (${(duration/iterations).toFixed(3)}ms per call) - Success: ${caseSuccessRate}%`);
  }
  
  const totalCalls = testCases.length * iterations;
  const avgTimePerCall = totalTime / totalCalls;
  const callsPerSecond = 1000 / avgTimePerCall;
  
  console.log('\n📊 Performance Summary:');
  console.log(`Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`Total calls: ${totalCalls.toLocaleString()}`);
  console.log(`Average time per call: ${avgTimePerCall.toFixed(3)}ms`);
  console.log(`Calls per second: ${callsPerSecond.toLocaleString()}`);
  console.log(`Success rate: ${(successCount / totalCalls * 100).toFixed(1)}%`);
  
  // Show failure details
  if (Object.keys(failureDetails).length > 0) {
    console.log('\n🔍 Failure Analysis:');
    for (const [testName, details] of Object.entries(failureDetails)) {
      console.log(`${testName}: Expected ${details.expected}, got ${details.actual} (${details.count} failures)`);
    }
  }
  
  // Performance thresholds
  if (avgTimePerCall > 1) {
    console.log('\n⚠️  Warning: Average call time is over 1ms');
    process.exit(1);
  } else if (avgTimePerCall > 0.5) {
    console.log('\n⚠️  Warning: Average call time is over 0.5ms');
  } else {
    console.log('\n✅ Performance is excellent!');
  }
  
  if (successCount / totalCalls < 0.95) {
    console.log('❌ Success rate is below 95%');
    process.exit(1);
  }
}

// Run the test
runPerformanceTests().catch(error => {
  console.error('Performance test failed:', error);
  process.exit(1);
});
