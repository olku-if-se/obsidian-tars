#!/usr/bin/env node
import { loadProviderSdkSnapshots } from '../src/demo/provider-demo'

async function main() {
  const snapshots = await loadProviderSdkSnapshots()
  const summary = Object.fromEntries(
    Object.entries(snapshots).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.length
        : typeof value === 'object'
          ? Object.keys(value ?? {}).length
          : typeof value,
    ])
  )
  console.log('[tars/providers] Loaded provider SDK snapshots:', summary)
}

void main()
