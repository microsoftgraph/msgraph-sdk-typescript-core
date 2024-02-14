module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ["@microsoft/eslint-config-msgraph"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    sourceType: "module",
  },
  plugins: [
    "eslint-plugin-jsdoc",
    "eslint-plugin-prefer-arrow",
    "@typescript-eslint",
  ],
  root: true,
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
  },
};
