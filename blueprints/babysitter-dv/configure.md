# Configure Babysitter-DV

Create `.a5c/processes/babysitter-dv/ports.mjs` from `ports.example.mjs`.

The module must export `createPorts(runInput)` or a default function that returns stack-neutral ports for the selected DV work item.

With no `itemId` input, `.a5c/processes/babysitter-dv.js#process` repeatedly calls `dv work ready --json` and runs ready candidates until no unblocked work remains or a Babysitter-DV gate halts the run.
