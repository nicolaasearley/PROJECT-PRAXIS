# Contributing

1. Use absolute imports (`@/…`) and keep files within the `src` domain folders.
2. Write TypeScript with strict types; avoid `any` and prefer documented interfaces.
3. Add unit tests for stores, engine logic, and shared components. Run `npm test` before committing (see registry note below).
4. Follow Prettier/ESLint defaults; format with `npm run format` and lint with `npm run lint`.
5. Update relevant docs in `/docs` when adding new flows or APIs.

> Note: If the package registry blocks fetching new dev dependencies, document the limitation in PR/test output and proceed with local validation where possible.
