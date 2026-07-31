/**
 * Compile Backend Typescript Code
 *
 * Compiles ts-code/ into ts-output/ so npm run test:unit has compiled JS
 * to run against. Used to also fan compiled output out into each Gen 1
 * Lambda's function folder for `amplify push` - that deploy path no
 * longer exists (Gen 1 is decommissioned, deploys go through Gen 2's
 * `ampx pipeline-deploy`), so this script now only compiles.
 */

const fs = require("fs");
const path = require("path")
const { exec } = require("child_process")

const REPO_ROOT = __dirname
const TS_OUTPUT_PATH = path.join(REPO_ROOT, "ts-output")

function deleteIfExists(targetPath) {
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true })
    }
}

deleteIfExists(TS_OUTPUT_PATH)

exec("tsc --project tsconfig.gen1.json", { cwd: REPO_ROOT },
    (error, stdout, stderr) => {
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        if (stdout) {
            console.log(`stdout: ${stdout}`);
        }
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
    }
)
