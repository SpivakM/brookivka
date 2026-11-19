# Operations Runbook

## Local startup

```bash
docker compose up --build
```

The backend is exposed at `http://localhost:8082`; PostGIS is available internally as `db:5432`.
For the mobile client, run the frontend setup script and use ADB reverse for Android.

## Basic diagnostics

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 db
curl -i http://localhost:8082/api/landmarks/nearby?lat=49.8418\&lng=24.0316\&radius=500
```

Check environment variables before investigating application code. Never print secret values.

## AWS checks

- Confirm the EC2 instance and backend container are running.
- Confirm the security group exposes only required ports.
- Confirm the S3 bucket remains private.
- Confirm CloudFront can read through Origin Access Control.
- Confirm the instance role has only required permissions.
- Check disk space, memory, swap, and container logs.

## Media incident

1. Stop repeated upload attempts if storage growth is suspected.
2. Verify object keys and CloudFront configuration without exposing private URLs.
3. Check replacement/deletion behavior for the affected landmark.
4. Rotate credentials if unauthorized access is suspected.
5. Record the incident and affected IDs privately.

## AI service incident

If recognition becomes unreliable:

1. Disable or gate recognition rather than returning guessed landmark names.
2. Preserve `UNCERTAIN` and `NOT_FOUND` responses.
3. Check model/index version, latency, candidate counts, and score distributions.
4. Roll back to the last evaluated model/index.
5. Record the event in `AI_EXPERIMENT_LOG.md`.

## Recovery requirements

Before production launch, document database backups, restore testing, secret rotation, HTTPS
termination, health checks, alerting, and an owner for each operational responsibility.
