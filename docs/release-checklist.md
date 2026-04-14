# Release Checklist

Use this checklist before cutting a tagged release.

## Validation

1. Run `make test`.
2. Run the frontend production build.
3. Verify the workbook in `data/` is the intended release dataset.
4. Review README accuracy for setup and product behavior.
5. Confirm `LICENSE` and `NOTICE.md` still match the publication plan.

## Versioning

1. Update [CHANGELOG.md](/home/daniel/code/dosorio79/schedulize/CHANGELOG.md) with the release notes.
2. Create a version tag such as `v0.1.1`.
