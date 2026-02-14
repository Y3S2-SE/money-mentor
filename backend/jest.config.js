export default {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js'
    ],

    testMatch: ['**/tests/**/*.test.js'],

    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
};