#!/bin/bash
CURRENT_DIR=$(dirname "${BASH_SOURCE[0]}")
source "$CURRENT_DIR/common.sh"

workDir=/setup

# Process arguments
args=()
while [ $# -gt 0 ]; do
    case $1 in
        --container) container=$2; shift ;;
        *) args+=("$1") ;;
    esac
    shift
done

if [ -z "$container" ]; then
    printErr "Please specify the target container"
    exit 1
fi

printInfo "Copying scripts to docker container..."
docker exec "$container" bash -c "[ -d $workDir ] && rm -fr $workDir; mkdir $workDir"
checkExitCode "Failed to setup directory on container '$container'"

docker cp "$CURRENT_DIR/" "$container:$workDir/"
checkExitCode "Failed to copy setup scripts to container '$container'"

docker cp "$CURRENT_DIR/n1ql" "$container:$workDir/n1ql"
checkExitCode "Failed to copy n1ql files to container '$container'"

docker exec "$container" bash $workDir/setup.sh "${args[@]}"
checkExitCode "Setup script failed"
