#!/bin/sh

set -eu

: "${VITE_BASE_URL:?VITE_BASE_URL must be set}"

escaped_base_url=$(printf '%s' "$VITE_BASE_URL" | sed 's/[&|\\]/\\&/g')

find /usr/share/nginx/html -type f -name '*.js' \
    -exec sed -i "s|__VITE_BASE_URL__|${escaped_base_url}|g" {} \;
