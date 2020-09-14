#!/bin/bash
CURRENT_DIR=$(dirname "${BASH_SOURCE[0]}")

showUsage() {
    echo
    echo "Usage: ./build.sh [--mode|-m release|debug]"
    echo
}

showInvalidOption() {
    echo "Invalid option '$1'" 1>&2
    showUsage
    exit 1
}

mode=release
while [ $# -gt 0 ]; do
    case $1 in
        -m|--mode) mode=$2; shift ;;
        *) showInvalidOption "$1" ;;
    esac
    shift
done

[[ "$mode" != "release" && "$mode" != "debug" ]] \
    && printErr "Invalid value for mode: '$1'" \
    && showUsage \
    && exit 1

echo "Clearing output directory..."
rm -fr "$CURRENT_DIR/build/static"

echo "Minifying html..."
npx html-minifier \
    -c "$CURRENT_DIR/config/minifyHtml.json" \
    --input-dir "$CURRENT_DIR/html" \
    --output-dir "$CURRENT_DIR/build/static" \
    --file-ext html
[ $? -ne 0 ] && exit 1

echo "Bundling javascript..."
npx rollup --config "$CURRENT_DIR/config/rollup.$mode.js"
[ $? -ne 0 ] && exit 1
