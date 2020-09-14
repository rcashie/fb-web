#!/bin/bash
printErr() {
    echo -e "\033[31mError: $1\033[0m" 1>&2
}

printInfo() {
    echo -e "\033[32m$1\033[0m"
}

checkExitCode() {
    if [ $? -ne 0 ]; then
        printErr "$1"
        exit 1
    fi
}
