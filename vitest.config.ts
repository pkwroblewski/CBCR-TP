import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test timeout
    testTimeout: 10000,
    
    // Setup file
    setupFiles: ['./tests/setup.ts'],
    
    // Include patterns
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    
    // Exclude patterns
    exclude: ['node_modules', 'dist', '.next'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/lib/validators/**/*.ts', 'src/lib/parsers/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/index.ts'],
    },
    
    // Globals (describe, it, expect)
    globals: true,
  },
  
  // Path aliases (match tsconfig)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

