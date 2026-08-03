const nextJest = require("next/jest")

const createJestConfig = nextJest({ dir: "./" })

const customJestConfig = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/.next/", "<rootDir>/node_modules/"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
}

module.exports = createJestConfig(customJestConfig)
