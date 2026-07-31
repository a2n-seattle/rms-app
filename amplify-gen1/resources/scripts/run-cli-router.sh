#!/bin/bash
# Local: RunCLIRouter
# Remote: RunCLIRouter remote

# cd to script directory
cd "$(dirname "$0")"/../../ || exit

npm run build

# Hard-Coded Table Names
export STORAGE_MAIN_NAME="main"
export STORAGE_ITEMS_NAME="items"
export STORAGE_BATCH_NAME="batch"
export STORAGE_TAGS_NAME="tags"
export STORAGE_HISTORY_NAME="history"
export STORAGE_TRANSACTIONS_NAME="transactions"

node ./ts-output/__dev__/handlers/router/CLIRouter.js $1
