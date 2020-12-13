#!/bin/bash
printErr() {
    echo -e "\e[31mError: $1\e[0m" 1>&2
}

printInfo() {
    echo -e "\e[32m$1\e[0m"
}

checkExitCode() {
    if [ $? -ne 0 ]; then
        printErr "$1"
        exit 1
    fi
}
