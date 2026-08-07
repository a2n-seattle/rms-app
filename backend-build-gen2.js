/**
 * Compile Backend Typescript Code for the Amplify Gen 2 backend.
 *
 * Compiles ts-code/ once and fans it out into each Lambda's
 * amplify/functions/<kebab-name>/build/ directory (used by each
 * function's resource.ts via lambda.Code.fromAsset(...)). Kept as a
 * separate script from backend-build.js (which compiles the same source
 * into ts-output/ for npm run test:unit) since the two serve different
 * consumers with different output shapes.
 *
 * GEN2_DIR remains overridable via env var for any ad hoc/worktree use
 * that wants a different target directory, but defaults to "amplify".
 */

const fs = require("fs");
const path = require("path")
const { exec } = require("child_process")

const REPO_ROOT = __dirname
const TS_OUTPUT_PATH = path.join(REPO_ROOT, "ts-output-gen2")
const GEN2_DIR = process.env.GEN2_DIR || "amplify"
const GEN2_FUNCTIONS_PATH = path.join(REPO_ROOT, GEN2_DIR, "functions")

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
                    "UpdateTags",
                    "GetItem",
                    "SearchItem",
                    "GetReservation",
                    "GetBatch",
                    "ListItems",
                    "ListReservations",
                    "ListMyOwnedItems",
                    "ListMyBorrowedItems",
                    "ListUpcomingReservations",
                    "ListOverdueItems",
                    "ListHistory",
                    "ListBatches",
                    "GetBorrowGroup",
                    "ExtendReservation",
                    "UpdateItem",
                    "UpdateSubItem"
]

function kebabCase(name) {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

function deleteIfExists(targetPath) {
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true })
    }
}

function deleteGen2BuildDirs() {
    if (!fs.existsSync(GEN2_FUNCTIONS_PATH)) {
        return
    }
    fs.readdirSync(GEN2_FUNCTIONS_PATH).forEach((dir) => {
        deleteIfExists(path.join(GEN2_FUNCTIONS_PATH, dir, "build"))
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

deleteIfExists(TS_OUTPUT_PATH)
deleteGen2BuildDirs()

// Compile Typescript (ts-code/ lives at repo root, shared by Gen 1 and Gen 2 builds)
exec(`tsc --project tsconfig.gen1.json --outDir ${TS_OUTPUT_PATH}`, { cwd: REPO_ROOT },
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
            path.join(TS_OUTPUT_PATH, "src"),
            smsrouterBuild
        )

        const preSignUpBuildDir = path.join(GEN2_FUNCTIONS_PATH, "pre-sign-up", "build")
        copySingleFile(
            path.join(TS_OUTPUT_PATH, "src", "handlers", "auth"),
            path.join(preSignUpBuildDir, "handlers", "auth"),
            "PreSignUp"
        )

        API_NAMES.forEach((apiName) => {
            const buildDir = path.join(GEN2_FUNCTIONS_PATH, kebabCase(apiName), "build")

            copyEntireDirectory(
                path.join(TS_OUTPUT_PATH, "src", "db"),
                path.join(buildDir, "db")
            )
            copyEntireDirectory(
                path.join(TS_OUTPUT_PATH, "src", "metrics"),
                path.join(buildDir, "metrics")
            )
            copyEntireDirectory(
                path.join(TS_OUTPUT_PATH, "src", "injection"),
                path.join(buildDir, "injection")
            )
            copySingleFile(
                path.join(TS_OUTPUT_PATH, "src", "api"),
                path.join(buildDir, "api"),
                apiName
            )
            copySingleFile(
                path.join(TS_OUTPUT_PATH, "src", "handlers", "api"),
                path.join(buildDir, "handlers", "api"),
                "APIHelper"
            )
            copySingleFile(
                path.join(TS_OUTPUT_PATH, "src", "handlers", "api"),
                path.join(buildDir, "handlers", "api"),
                apiName
            )
        })
    }
)
