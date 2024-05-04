import fs from "node:fs/promises";
import path from "node:path";
import { PACKAGES_PATH } from "../utils/read-packages.js";
import * as ui from "./ui.js";
import * as uiLib from "./ui-lib.js";
import * as node from "./node.js";
import * as nodeLib from "./node-lib.js";
import * as nodeUiBridge from "./node-ui-bridge.js";
import { CONFIG, initializeConfig } from "./config.js";
import { PACKAGE_TYPE } from "./models.js";

const PACKAGE_TYPE_TO_TEMPLATE = {
  [PACKAGE_TYPE.UI]: ui,
  [PACKAGE_TYPE["UI Library"]]: uiLib,
  [PACKAGE_TYPE.Node]: node,
  [PACKAGE_TYPE["Node Library"]]: nodeLib,
  [PACKAGE_TYPE["Node UI Bridge"]]: nodeUiBridge,
};

const create = async () => {
  await initializeConfig();

  const template = PACKAGE_TYPE_TO_TEMPLATE[CONFIG.type];

  let fileIndex = 0;

  while (fileIndex < template.files.length) {
    const file = template.files[fileIndex]();

    fileIndex++;

    const filePath = path.resolve(PACKAGES_PATH, ...CONFIG.path, ...file.path);

    const dirname = path.dirname(filePath);

    const exist = await fs.access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!exist) {
      await fs.mkdir(dirname, { recursive: true });
    }

    await fs.writeFile(filePath, file.content, "utf-8");
  }

  if (template.effect) {
    await template.effect();
  }
};

create()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
