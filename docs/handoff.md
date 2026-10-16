# GitHub and preview handoff

The public repository and Draft PR are published. Main contains the foundation and all substantive work is on feature/chrome-sculpture. A separate Vercel project exists; Preview deployment is blocked by workspace authorization.

## Repository publication update

The owner created https://github.com/tupptupp/spatial-interface-lab . It was verified empty, then populated through the connected GitHub tools. Main contains the minimal foundation; feature/chrome-sculpture contains substantive work. Commits were recreated through the connector using identical blob contents, so remote IDs differ from the local bundle supplied before the repository existed. Use the published repository for further development; do not push the old bundle over the remote history.

[Draft PR #1](https://github.com/tupptupp/spatial-interface-lab/pull/1) is open; the prepared description is also in docs/pr-draft.md. Remote Chromium verification has passed at the checkpoints recorded in docs/verification.md. Hardware profiling and deployed-preview verification remain outstanding.

## Vercel Preview only

A separate new project is required. Do not change an existing Vercel project, connect private projects, add paid services, provide tokens in chat or promote a deployment.

The feature includes `vercel.json` declaring Vite/dist and an automatic Git deployment allow-list for `feature/chrome-sculpture`. The build guard rejects Vercel production builds. Git settings alone are not a security boundary against a manual deployment; the build guard is additional protection, and owner authorization remains required before any future production release.

Use an authenticated Vercel session to configure only the new project. A CLI `vercel deploy` defaults to a Preview deployment; do not pass `--prod` or change the target to production. An initial dashboard import may try a production deploy: stop and configure a preview path rather than completing that step. Vercel connector operations created only the new empty project. Source upload was denied and no deployment exists.

After connecting: verify the actual build, correct asset paths, startup, all scroll states, mobile and fallback in the feature preview. Keep deployment protection intact. Do not send credentials to the app. If authentication or settings require the owner, stop at that exact step.

Official references consulted 2026-10-16:

- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/cli/deploy

## Deployment attempt result

The Vercel connection is installed and its tools are available. Creating a project with Git linking failed because the GitHub integration is not authorized. A new empty project was successfully created without Git linking. Uploading the first source file with its explicit project account/workspace ID was denied with HTTP 403 for tupptupp1337-3910. No file upload or deployment succeeded. Do not retry with another scope to evade the restriction; the owner must resolve the workspace permissions and GitHub integration. Existing Vercel projects were untouched.

## Connection recheck

After the owner reported both integrations connected, an explicit scoped read of this project still returned HTTP 403: access to workspace `tupptupp1337-3910` is not authorized. The installed connector and the GitHub integration do not establish this workspace permission. No Vercel CLI is available for the mapped fallback. Check connector access to this exact workspace before retrying; do not switch scopes or send tokens in chat.
