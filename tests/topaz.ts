import fs from "fs";
import util from "node:util";

import { Directory } from "../src";
import { logger } from "../src/util/log";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const exec = util.promisify(require("node:child_process").exec);
const RETRY_OPTIONS = { retries: 30, retryIntervalMs: 4000 };
export const TOPAZ_TIMEOUT =
  RETRY_OPTIONS.retries * RETRY_OPTIONS.retryIntervalMs;

export class Topaz {
  async start() {
    await execute("topaz templates install todo -f --no-console -i");

    const certsDir = await this.caCert();

    await retry(async () => fs.readFileSync(certsDir), RETRY_OPTIONS);
    logger.debug("certificates are ready");

    await execute("topaz config info");

    logger.debug(`topaz start with ${certsDir}`);

    const directoryClient = new Directory({
      url: "https://localhost:9292",
      caFile: certsDir,
    });
    await retry(
      async () => directoryClient.objects({ objectType: "user" }),
      RETRY_OPTIONS,
    );
  }

  async stop() {
    await execute("topaz stop");
  }

  async caCert() {
    return `${(
      await execute("topaz config info | jq -r '.config.topaz_certs_dir'")
    ).replace(/(\r\n|\n|\r)/gm, "")}/grpc-ca.crt`;
  }

  async dbDir() {
    return `${(
      await execute("topaz config info | jq -r '.config.topaz_db_dir'")
    ).replace(/(\r\n|\n|\r)/gm, "")}`;
  }

  async configDir() {
    return `${(
      await execute("topaz config info | jq -r '.config.topaz_cfg_dir'")
    ).replace(/(\r\n|\n|\r)/gm, "")}`;
  }
}

const retry = async <T>(
  fn: () => Promise<T> | T,
  { retries, retryIntervalMs }: { retries: number; retryIntervalMs: number },
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    logger.debug((error as Error).message);
    if (retries <= 0) {
      throw error;
    }
    logger.debug(`Retrying...`);
    await sleep(retryIntervalMs);
    return retry(fn, { retries: retries - 1, retryIntervalMs });
  }
};
const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const execute = async (command: string) => {
  const { error, stdout, stderr } = await exec(command);
  if (error) {
    logger.debug(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    logger.debug(`stderr: ${stderr}`);
    return;
  }
  return stdout;
};
