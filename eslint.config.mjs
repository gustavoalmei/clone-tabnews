import js from "@eslint/js";
import next from "eslint-config-next/core-web-vitals";
import jest from "eslint-plugin-jest";
import prettier from "eslint-config-prettier";

const config = [
  js.configs.recommended,
  ...next,
  jest.configs["flat/recommended"],
  prettier,
];

export default config;
