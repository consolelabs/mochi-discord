# Deploying mochi-discord

One honest path. A release tag deploys itself; nothing else touches prod.

## The path

```
git tag vX.Y.Z + push tag
        │
        ▼
.github/workflows/gke-prod.yml
        │  docker build + push          (auth: the workflow's own GITHUB_TOKEN)
        ▼
ghcr.io/consolelabs/mochi-discord:{tag,sha}
        │  kustomize edit set image     (auth: INFRA_BOT_PAT, bot identity)
        ▼
consolelabs/infrastructure mochi-discord/prod  → cluster applies (mochi-prod ns)
```

Manual re-run without a new tag: Actions → "Build and Deploy to Prod" → Run workflow
(builds current develop, image tagged `<sha>-<timestamp>`).

## Manual fallback (when Actions is down)

```sh
docker build -t ghcr.io/consolelabs/mochi-discord:manual-$(git rev-parse --short HEAD) .
docker push ghcr.io/consolelabs/mochi-discord:manual-$(git rev-parse --short HEAD)
# in consolelabs/infrastructure/mochi-discord/prod:
kustomize edit set image ghcr.io/consolelabs/mochi-discord=ghcr.io/consolelabs/mochi-discord:manual-<sha>
git commit -am "[skip ci] mochi-discord prod image update" && git push origin main
```

## Credentials (complete list)

| Cred | Where | Used for | Owner / rotation |
|---|---|---|---|
| `GITHUB_TOKEN` | issued per workflow run | ghcr.io image push | automatic, no rotation |
| `INFRA_BOT_PAT` | repo secret (bot account PAT, `repo` scope on consolelabs/infrastructure) | kustomize bump commit | Han; rotate yearly |
| `ghcr-pull` | k8s secret in `mochi-prod` (bot PAT, `read:packages`) | cluster pulls the private image | Han; rotate yearly |

Legacy (dead, do not revive): `GCP_CREDENTIALS` (SA deleted), personal `GH_PAT`.

## Verify a deploy

```sh
gh run list -R consolelabs/mochi-discord --workflow=gke-prod.yml -L 1
kubectl -n mochi-prod get deploy mochi-discord -o jsonpath='{..image}'   # expect the ghcr tag just pushed
```
