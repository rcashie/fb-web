#!/bin/bash
CURRENT_DIR=$(dirname "${BASH_SOURCE[0]}")
source "$CURRENT_DIR/common.sh"

showInvalidOption() {
    printErr "Invalid parameter '$1'"
    exit 1
}

# Set defaults
cluster=127.0.0.1
ftsRamSize=2048
dataRamSize=2048
indexRamSize=2048
bktPublishedRamSize=1024
bktProposedRamSize=1024
createBktIndices=0
createFtsIndices=0

# Process arguments
while [ $# -gt 0 ]; do
    case $1 in
        --user) user=$2; shift ;;
        --password) password=$2; shift ;;
        --cluster) cluster=$2; shift ;;
        --fts-ram-size) ftsRamSize=$2; shift ;;
        --data-ram-size) dataRamSize=$2; shift ;;
        --index-ram-size) indexRamSize=$2; shift ;;
        --bkt-published-ram-size) bktPublishedRamSize=$2; shift ;;
        --bkt-proposed-ram-size) bktProposedRamSize=$2; shift ;;
        --create-bkt-indices) createBktIndices=1 ;;
        --create-fts-indices) createFtsIndices=1 ;;
        *) showInvalidOption "$1" ;;
    esac
    shift
done

if [ -z "$user" ] || [ -z "$password" ]; then
    printErr "Please specify a user and password"
    exit 1
fi

runQueryScript() {
    cbq \
        --engine "http://$cluster:8091" \
        --quiet \
        --user="$user" \
        --password="$password" \
        --script "$1" \
        --exit-on-error

    checkExitCode "Failed to execute query script '$1'"
}

runQueryFile() {
    cbq \
        --engine "http://$cluster:8091" \
        --quiet \
        --user="$user" \
        --password="$password" \
        --file "$1" \
        --exit-on-error

    checkExitCode "Failed to execute query file '$1'"
}

initializeCluster() {
    printInfo "Initializing cluster..."
    result=$(couchbase-cli cluster-init \
        --cluster "$cluster:8091" \
        --cluster-username "$user" \
        --cluster-password "$password" \
        --cluster-name "framebastard" \
        --services data,index,query,fts \
        --cluster-ramsize "$dataRamSize" \
        --cluster-index-ramsize "$indexRamSize" \
        --cluster-fts-ramsize "$ftsRamSize")

    if [ $? -ne 0 ]; then
        existed=$(echo "$result" | grep "Cluster is already initialized")
        if [ -z "$existed" ]; then
            printErr "$result"
            (exit 1)
        else
            printInfo "Cluster already initialized"
        fi
    fi

    checkExitCode "Failed to initialize cluster"
}

setupBuckets() {

    createBucket() {
        result=$(couchbase-cli bucket-list \
            --cluster "$cluster:8091" \
            --username "$user" \
            --password "$password")

        if echo "$result" | grep -q "$1"; then
            printInfo "Bucket '$1' already exists"
        else
            printInfo "Creating '$1' bucket..."
            couchbase-cli bucket-create \
                --cluster "$cluster:8091" \
                --username "$user" \
                --password "$password" \
                --bucket "$1" \
                --bucket-type couchbase \
                --bucket-ramsize "$2" \
                --wait

            checkExitCode "Failed to create bucket"
        fi
    }

    createBucket "published" "$bktPublishedRamSize"
    createBucket "proposed" "$bktProposedRamSize"
}

createFtsIndices() {

    printInfo "Setting FTS indices..."

    # Delete any existing indices
    status=$(curl -s \
        -X DELETE \
        -w "%{http_code}" \
        -H "Authorization: Basic $(echo -n "$user:$password" | base64)" \
        -H "Content-Type: application/json" \
        -o /dev/null \
        "http://$cluster:8094/api/index/tagset")

    checkExitCode "Failed to delete FTS index"
    if [ "$status" -ne "200" ] && [ "$status" -ne "400" ]; then
        printErr "Failed to delete FTS index with http status code: $status"
        exit 1
    fi

    # Set the FTS index
    fts_index=$(cat "$CURRENT_DIR/n1ql/fts_index.json")
    status=$(curl -s \
        -X PUT \
        -w "%{http_code}" \
        -H "Authorization: Basic $(echo -n "$user:$password" | base64)" \
        -H "Content-Type: application/json" \
        -d "$fts_index" \
        -o /dev/null \
        "http://$cluster:8094/api/index/tagset")


    checkExitCode "Failed to update FTS index"
    if [ "$status" -ne "200" ]; then
        printErr "Failed to update FTS index with http status code: $status"
        exit 1
    fi

    printInfo "Done."
}

createBucketIndices() {
    printInfo "Getting existing indices..."
    query="SELECT RAW (\"\`\" || keyspace_id || \"\`.\`\" || name || \"\`\") FROM system:indexes WHERE name != \"tagset\""
    result=$(runQueryScript "$query")
    checkExitCode "$result"

    # Parse the output using jq
    indices=()
    IFS=" " read -r -a indices < <(echo "$result" | jq -r ".results | @sh")
    checkExitCode "Failed to parse json indices result"

    for i in "${indices[@]}"
    do
        # Remove quotes
        index=$(echo "$i" | sed -n -E "s/^'(.+)'$/\1/p")

        # Drop index
        printInfo "Dropping index $index..."
        checkExitCode "$(runQueryScript "DROP INDEX $index")"
    done

    # Apply indices
    printInfo "Creating indices..."
    checkExitCode "$(runQueryFile "$CURRENT_DIR/n1ql/proposed_indices.n1ql")"
    checkExitCode "$(runQueryFile "$CURRENT_DIR/n1ql/published_indices.n1ql")"
    printInfo "Done."
}

# Check for Couchbase tools installation
if [ -z "$(which couchbase-cli)" ]; then

    checkDir() {
        [ -d "$1" ] && echo ":$1"
    }

    # include the standard directories
    PATH="$PATH$(checkDir "/opt/couchbase/bin")"
    PATH="$PATH$(checkDir "/opt/couchbase/bin/tools")"
    PATH="$PATH$(checkDir "/opt/couchbase/bin/install")"
    export PATH

    if [ -z "$(which couchbase-cli)" ]; then
        printErr "Could not find couchbase tools. Try setting up couchbase in a docker container using setup_docker.sh"
        exit 1
    fi
fi

# Check for jq installation
if [ -z "$(which jq)" ]; then
    printInfo "Installing jq"
    apt update
    apt install jq -y
    checkExitCode "Failed to install jq"
fi

initializeCluster
setupBuckets

if [ "$createFtsIndices" -eq 1 ]; then
    createFtsIndices
fi

if [ "$createBktIndices" -eq 1 ]; then
    createBucketIndices
fi
