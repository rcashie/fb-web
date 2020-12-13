#!/bin/bash
CURRENT_DIR=$(dirname "${BASH_SOURCE[0]}")
DEFAULT_MODE='release'

showUsage() {
    echo -e "$(cat << EOM
USAGE: ./fb.sh command [OPTIONS]

\e[7m./fb.sh run-server [--mode|-m release|debug]\e[0m
Starts the web-server. This will compile the server if required. Effectively runs 'cargo build'.
Default mode is 'release'.

\e[7m./fb.sh watch-client [--mode|-m release|debug]\e[0m
Watches the source of client and triggers a client build when something changes. If the web server is running (run-server) just refresh the browser to see your changes. Effectively runs 'chokidar'.
Default mode is 'release'.

\e[7m./fb.sh build [--mode|-m release|debug] [--client|-c] [--server|-s]\e[0m
Builds the specified targets: client, server or both. At least one must be specified.
EOM
)"
}

printErr() {
    echo -e "\e[31mError: $1\e[0m" 1>&2
}

printInfo() {
    echo -e "\e[32m$1\e[0m"
}

checkModeArgument() {
    [[ "$1" != "release" && "$1" != "debug" ]] \
        && printErr "Invalid value for mode: '$1'" \
        && showUsage \
        && exit 1
}

showInvalidOption() {
    printErr "Invalid option for command '$1': '$2'"
    showUsage
    exit 1
}

doWatchClient() {
    mode=$DEFAULT_MODE
    while [ $# -gt 0 ]; do
        case $1 in
            -m|--mode) mode=$2; shift ;;
            *) showInvalidOption "watch-client" "$1" ;;
        esac
        shift
    done

    checkModeArgument "$mode"
    ( cd "$CURRENT_DIR/client" && npx chokidar "./html/" "./cmps/" "./images/" -c "./build.sh -m $mode" )
    [ $? -ne 0 ] && exit $?
}

doRunServer() {
    mode=$DEFAULT_MODE
    while [ $# -gt 0 ]; do
        case $1 in
            -m|--mode) mode=$2; shift ;;
            *) showInvalidOption "run-server" "$1" ;;
        esac
        shift
    done

    checkModeArgument "$mode"
    printInfo "Running server in '$mode' mode..."
    [ "$mode" == "release" ] && option="--release"
    ( cd "$CURRENT_DIR/server" && cargo run $option )
    [ $? -ne 0 ] && exit $?
}

doBuild() {
    mode=$DEFAULT_MODE
    server=0
    client=0
    while [ $# -gt 0 ]; do
        case $1 in
            -m|--mode) mode=$2; shift ;;
            -c|--client) client=1 ;;
            -s|--server) server=1 ;;
            *) showInvalidOption "build" "$1" ;;
        esac
        shift
    done

    checkModeArgument "$mode"
    if [[ "$server" -eq 0 && "$client" -eq 0 ]]; then
        printErr "At least one build target must be specified."
        showUsage
        exit 1
    fi

    if [ $server -eq 1 ]; then
        printInfo "Building server in '$mode' mode..."
        [ "$mode" == "release" ] && option="--release"
        ( cd "$CURRENT_DIR/server" && cargo build $option )
        [ $? -ne 0 ] && exit $?
    fi

    if [ $client -eq 1 ]; then
        printInfo "Building client in '$mode' mode..."
        ( cd "$CURRENT_DIR/client" && ./build.sh --mode "$mode" )
        [ $? -ne 0 ] && exit $?
    fi
}

command=$1; shift
case $command in
    watch-client) doWatchClient "$@" ;;
    run-server) doRunServer "$@" ;;
    build) doBuild "$@";;
    *) printErr "Invalid command '$command'" ; showUsage; exit 1 ;;
esac
