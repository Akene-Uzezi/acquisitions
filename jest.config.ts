import type { Config } from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: 'ts-jest',
  // 1. Tell Jest to treat .ts files as ESM
  extensionsToTreatAsEsm: ['.ts'],

  moduleNameMapper: {
    // 2. Map relative imports: transforms './app.js' -> './app'
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // 3. Map subpath imports: transforms '#config/logger.js' -> 'src/config/logger'
    '^#config/(.*)\\.js$': '<rootDir>/src/config/$1',
    '^#controllers/(.*)\\.js$': '<rootDir>/src/controllers/$1',
    '^#middleware/(.*)\\.js$': '<rootDir>/src/middleware/$1',
    '^#models/(.*)\\.js$': '<rootDir>/src/models/$1',
    '^#routes/(.*)\\.js$': '<rootDir>/src/routes/$1',
    '^#services/(.*)\\.js$': '<rootDir>/src/services/$1',
    '^#utils/(.*)\\.js$': '<rootDir>/src/utils/$1',
    '^#types/(.*)\\.js$': '<rootDir>/src/types/$1',
    '^#validations/(.*)\\.js$': '<rootDir>/src/validations/$1',
    // Fallback for paths without .js extension
    '^#src/(.*)$': '<rootDir>/src/$1',
  },

  transform: {
    // 4. Configure ts-jest to use ESM mode
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};

export default config;
