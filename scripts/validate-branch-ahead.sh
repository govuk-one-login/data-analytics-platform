#!/bin/bash -e

# see https://stackoverflow.com/a/76151412 for inspiration for this script and the workflow code that calls it

HEAD_HASH=$(git rev-parse --short HEAD)

if ! git merge-base --is-ancestor origin/main "$HEAD_HASH"; then
  exit 1
fi
