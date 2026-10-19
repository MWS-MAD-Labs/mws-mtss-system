// Test setup file
require('dotenv').config({ path: '.env' });

// Set test environment
process.env.NODE_ENV = 'test';
// TEST_MONGODB_URI lets a run use a throwaway Mongo instead of the one on this port.
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test';

// Mock Google AI for testing
jest.mock('../src/config/googleAI', () => ({
    generateContent: jest.fn().mockResolvedValue('Mock AI response for testing'),
    testConnection: jest.fn().mockResolvedValue(true)
}));

// Mock cache service for testing
jest.mock('../src/services/cacheService', () => ({
    setSession: jest.fn(),
    getSession: jest.fn(),
    deleteSession: jest.fn(),
    setUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    setDashboardStats: jest.fn(),
    getDashboardStats: jest.fn(),
    setCheckinAnalysis: jest.fn(),
    getCheckinAnalysis: jest.fn()
}));
