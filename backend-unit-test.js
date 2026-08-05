/**
 * Test Backend Code
 */
const { exec } = require("child_process")

const MASTER_PATH = __dirname

const STORAGE_MAIN_NAME="main"
const STORAGE_ITEMS_NAME="items"
const STORAGE_BATCH_NAME="batch"
const STORAGE_TAGS_NAME="tags"
const STORAGE_HISTORY_NAME="history"
const STORAGE_TRANSACTIONS_NAME="transactions"
const STORAGE_USER_NAME="user"

// Compile Typescript
exec("jest --json --outputFile=report.json --colors --testPathPattern='.*/unit/.*.test.js'",
    {
        cwd: MASTER_PATH,
        env: {
            ...process.env,
            STORAGE_MAIN_NAME,
            STORAGE_ITEMS_NAME,
            STORAGE_BATCH_NAME,
            STORAGE_TAGS_NAME,
            STORAGE_HISTORY_NAME,
            STORAGE_TRANSACTIONS_NAME,
            STORAGE_USER_NAME
        }
    },
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