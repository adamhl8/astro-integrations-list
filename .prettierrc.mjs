/** @type {import("prettier").Config} */
export default {
  printWidth: 120,
  semi: false,
  plugins: ["prettier-plugin-astro"],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
}
