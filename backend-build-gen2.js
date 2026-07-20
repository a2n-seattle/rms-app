/**
 * Compile Backend Typescript Code for the Amplify Gen 2 rebuild.
 *
 * Mirrors backend-build.js's compile-once/fan-out-copy logic exactly, but
 * targets amplify-gen2/functions/<kebab-name>/build/ instead of Gen 1's
 * amplify/backend/function/<Name>/src/ts-output/. Kept as a separate script
 * (not a modification of backend-build.js) so Gen 1 stays fully buildable
 * and deployable for the duration of the parallel-build migration window.
 */

const fs = require("fs");
const path = require("path")
const { exec } = require("child_process")

const MASTER_PATH = path.join(__dirname, "amplify")
const GEN2_FUNCTIONS_PATH = path.join(__dirname, "amplify-gen2", "functions")

const API_NAMES = [
                    "AddItem",
                    "BorrowItem",
                    "BorrowFromSchedule",
                    "CreateBatch",
                    "CreateReservation",
                    "DeleteBatch",
                    "DeleteItem",
                    "DeleteReservation",
                    "ReturnItem",
                    "UpdateTags"
]

function kebabCase(name) {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

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

function deleteGen2BuildDirs() {
    if (!fs.existsSync(GEN2_FUNCTIONS_PATH)) {
        return
    }
    fs.readdirSync(GEN2_FUNCTIONS_PATH).forEach((dir) => {
        const buildPath = path.join(GEN2_FUNCTIONS_PATH, dir, "build")
        if (fs.existsSync(buildPath)) {
            fs.rmSync(buildPath, { recursive: true, force: true })
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
deleteGen2BuildDirs()

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

        // Move to Gen 2 function build folders
        const smsrouterBuild = path.join(GEN2_FUNCTIONS_PATH, "smsrouter", "build")
        copyEntireDirectory(
            path.join(MASTER_PATH, "ts-output", "src"),
            smsrouterBuild
        )

        API_NAMES.forEach((apiName) => {
            const buildDir = path.join(GEN2_FUNCTIONS_PATH, kebabCase(apiName), "build")

            copyEntireDirectory(
                path.join(MASTER_PATH, "ts-output", "src", "db"),
                path.join(buildDir, "db")
            )
            copyEntireDirectory(
                path.join(MASTER_PATH, "ts-output", "src", "metrics"),
                path.join(buildDir, "metrics")
            )
            copyEntireDirectory(
                path.join(MASTER_PATH, "ts-output", "src", "injection"),
                path.join(buildDir, "injection")
            )
            copySingleFile(
                path.join(MASTER_PATH, "ts-output", "src", "api"),
                path.join(buildDir, "api"),
                apiName
            )
            copySingleFile(
                path.join(MASTER_PATH, "ts-output", "src", "handlers", "api"),
                path.join(buildDir, "handlers", "api"),
                "APIHelper"
            )
            copySingleFile(
                path.join(MASTER_PATH, "ts-output", "src", "handlers", "api"),
                path.join(buildDir, "handlers", "api"),
                apiName
            )
        })
    }
)
