# Install Babysitter-DV

This blueprint installs a project-local Babysitter-DV process that can drain ready Doc-Vader work items through the vanilla Babysitter surface.

After install and repository-specific port configuration, run:

```text
/babysitter:call systematically work through the ready DV backlog using the project Babysitter-DV process
```

Shell equivalent:

```sh
genty call --harness <harness> --process .a5c/processes/babysitter-dv.js#process --workspace .
```

The install process writes `.a5c/processes/babysitter-dv.js`, `.a5c/processes/babysitter-dv/`, and blueprint documentation under `.a5c/blueprints/babysitter-dv/`.
