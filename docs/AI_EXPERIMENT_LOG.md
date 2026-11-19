# AI Experiment Log

This log records reproducible AI experiments. One entry should be added for every meaningful
dataset, model, retrieval, threshold, or reranking change.

## Required entry format

```text
## EXP-YYYY-MM-DD-<short-name>

- Date:
- Owner:
- Goal:
- Code commit:
- Dataset version:
- Dataset split:
- Detector/model:
- Embedding model:
- Vector index:
- Reranking weights:
- Hardware/runtime:
- Metrics:
- Result:
- Decision:
- Follow-up:
```

## Evaluation requirements

At minimum, record:

- top-1 and top-5 retrieval accuracy;
- `MATCHED`, `UNCERTAIN`, and `NOT_FOUND` precision;
- false-positive rate for nearby but incorrect landmarks;
- latency by pipeline stage;
- performance by object type, viewpoint, lighting, and distance;
- the top-1/top-2 score margin distribution.

## Rules

- Never compare experiments using different dataset splits without documenting it.
- Keep dataset and model versions immutable after publication.
- Store large artifacts outside Git and record their checksums and locations.
- Do not use private user images for training without documented consent and retention rules.
- A model is not production-ready without a held-out evaluation result and rollback path.

## Initial baseline

The planned baseline is detector plus ROI crop, DINOv2-style embeddings, FAISS retrieval, and
visual/geographic/heading reranking. No benchmark result exists yet; the first experiment must
establish that baseline before fine-tuning.
