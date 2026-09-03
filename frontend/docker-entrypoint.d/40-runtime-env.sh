#!/bin/sh
set -eu

js_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e "s/'/\\\\'/g"
}

runtime_hub_base_url="${VITE_HUB_BASE_URL:-${HUB_BASE_URL:-}}"

cat > /usr/share/nginx/html/mtss/env.js <<INNER
window.__MWS_MTSS_ENV__ = {
  VITE_HUB_BASE_URL: '$(js_escape "$runtime_hub_base_url")',
};
INNER
