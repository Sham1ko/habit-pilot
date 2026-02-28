const config = {
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	watchman: false,
	transform: {
		"^.+\\.(t|j)sx?$": ["babel-jest", { presets: ["next/babel"] }],
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
	modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

module.exports = config;
