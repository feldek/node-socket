/// <reference path="./strong-ts/strong-ts.d.ts" />

declare module "*.jpg";

declare module "*.jpeg";

declare module "*.webp";

declare module "*.png";

declare module "*.svg";

declare module "*.graphql";

// ! declare only before .css
declare module "*.module.css" {
  const classes: Record<string, string>;

  export default classes;
}

declare module "*.css";

declare module "postcss-preset-env" {
  import { default as creator } from "postcss-preset-env/dist/index";
  export default creator;
}
