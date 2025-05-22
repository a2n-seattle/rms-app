/**
 * Compile Backend Typescript Code
 */

const fs = require("fs");
const path = require("path")
const { exec } = require("child_process")

const MASTER_PATH = path.join(__dirname, "amplify")


const API_NAMES = [
                    "AddItem",
                    "BorrowItem",
                    "CreateBatch",
                    "CreateReservation",
                    "DeleteBatch",
                    "DeleteItem",
                    "DeleteReservation",
                    "GetItem",
                    "ReturnItem",
                    "UpdateTags"
]

function deleteTsOutput(parentPath) {
    fs.readdirSync(parentPath).forEach((file) => {
        const curPath = path.join(parentPath, file)
        if (fs.lstatSync(curPath).isDirectory()) {
            if (file == "ts-output") {
                fs.rmSync(curPath, { recursive: true, force: true })
            } else if (file !== "#current-cloud-backend") {
                deleteTsOutput(curPath)
            }
        }
    })
}

function copyEntireDirectory(source, target) {
    if ( !fs.existsSync(target) ) {
        fs.mkdirSync(target, { recursive: true })
    }

    fs.readdirSync(source).forEach((file) => {
        if (fs.lstatSync(path.join(source, file)).isDirectory()) {
            copyEntireDirectory(path.join(source, file), path.join(target, file))
        } else {
            fs.copyFileSync(path.join(source, file), path.join(target, file))
        }
    })
}

function copySingleFile(sourceDir, targetDir, filename) {
    if ( !fs.existsSync(targetDir) ) {
        fs.mkdirSync(targetDir, { recursive: true })
    }

    fs.copyFileSync(path.join(sourceDir, filename + ".js"), path.join(targetDir, filename + ".js"))
    fs.copyFileSync(path.join(sourceDir, filename + ".d.ts"), path.join(targetDir, filename + ".d.ts"))
}

deleteTsOutput(MASTER_PATH)

// Compile Typescript
exec("tsc", { cwd: MASTER_PATH },
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

        // Move to Lambda Folders
        copyEntireDirectory(
            path.join(MASTER_PATH, "ts-output", "src"),
            path.join(MASTER_PATH, "backend", "function", "smsrouter", "src", "ts-output")
        )

        API_NAMES.forEach((apiName) => {
            copyEntireDirectory(
                path.join(MASTER_PATH, "ts-output", "src", "db"),
                path.join(MASTER_PATH, "backend", "function", apiName, "src", "ts-output", "db")
            )
            copyEntireDirectory(
                path.join(MASTER_PATH, "ts-output", "src", "metrics"),
                path.join(MASTER_PATH, "backend", "function", apiName, "src", "ts-output", "metrics")
            )
            copyEntireDirectory(
                path.join(MASTER_PATH, "ts-output", "src", "injection"),
                path.join(MASTER_PATH, "backend", "function", apiName, "src", "ts-output", "injection")
            )
            copySingleFile(
                path.join(MASTER_PATH, "ts-output", "src", "api"),
                path.join(MASTER_PATH, "backend", "function", apiName, "src", "ts-output", "api"),
                apiName
            )
            copySingleFile(
                path.join(MASTER_PATH, "ts-output", "src", "api"),
                path.join(MASTER_PATH, "backend", "function", apiName, "src", "ts-output", "api"),
                apiName
            )
            copySingleFile(
                path.join(MASTER_PATH, "ts-output", "src", "handlers", "api"),
                path.join(MASTER_PATH, "backend", "function", apiName, "src", "ts-output", "handlers", "api"),
                "APIHelper"
            )
            copySingleFile(
                path.join(MASTER_PATH, "ts-output", "src", "handlers", "api"),
                path.join(MASTER_PATH, "backend", "function", apiName, "src", "ts-output", "handlers", "api"),
                apiName
            )
        })
    }
)