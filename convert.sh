#!/bin/bash

# requires fd (https://github.com/sharkdp/fd) and rg (https://github.com/BurntSushi/ripgrep/)

# fd --full-path './src' -e js -x bash -c "rg \"from 'react';$\" {} -l && if [ $? -eq 0 ]; then mv {} {.}.jsx; fi"
# fd '\.js$' ./src -x node <ABS_PATH_TO_REPO>/flow-to-typescript/dist/src/cli.js -i {} -o {.}.ts
# fd '\.jsx$' ./src -x node <ABS_PATH_TO_REPO>/flow-to-typescript/dist/src/cli.js -i {} -o {.}.tsx
