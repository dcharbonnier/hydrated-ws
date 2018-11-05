#!/bin/sh
version=$1
temp_dir=$(mktemp -d)
package_path=`pwd`

cd $temp_dir && \
yarn init -y && \
yarn add typescript/@$version && \
yarn add $package_path && \
echo 'import * as hWs from "hydrated-ws/dist";' > test-compile.ts && \
./node_modules/.bin/tsc test-compile.ts && cd $package_path || { cd $package_path ; exit 1; }
