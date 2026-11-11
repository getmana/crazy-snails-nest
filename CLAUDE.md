# basimtuklet API (crazy-snails-nest)

NestJS + Prisma/PostgreSQL REST API, Zod validation, JWT auth. Solo learning project.
Frontend: sibling repo `crazy-snails-front` (Next.js, `~/projects/CS/cs-front`).

`docs/ARCHITECTURE.md` explains how the code works. Read the relevant section before changing
that area (§4 auth, §5 validation, §6 errors, §7 modules, §9 testing).

## Commands
- `npm run lint:check`, `npm run typecheck`, `npm run build`, `npm test`
- One spec: `npx jest --testPathPatterns <name>`
- `npx prisma migrate dev`, `npx prisma generate`, `npx prisma db seed`
- A task is done only when lint:check, typecheck, build and the related tests pass (the same
  checks CI runs). Jest does not type-check, so typecheck is mandatory; build catches what
  typecheck doesn't (`tsconfig.build.json`, `nest-cli.json`).

## How to treat the rules below
- **Decisions** are mine. Never change a decision, or change code in a way that departs from one,
  without asking.
- **Current conventions** describe how the code is written today. I haven't reviewed them all.
  Follow them, but if you believe one is poor practice, say so, give a source, and let me decide.
- If existing or requested code conflicts with a decision or convention, **stop and flag it**:
  which rule, where the code deviates, and whether you'd fix the code or amend the rule.
  Never silently change a rule, or the docs, to fit the code.
- Once a rule changes, update `CLAUDE.md`, the code, and `docs/ARCHITECTURE.md` together in one commit.

## Decisions
- Error format is custom `{ statusCode, code, message }`, chosen over RFC 9457. `code` drives FE i18n.
- Services return Prisma results, with no response-mapping layer yet. (Planned to revisit.)
- Unit tests only. Integration/e2e tests against a test DB are planned.

## Open questions
Known gaps waiting on a decision. Don't fix them in passing and don't build on them; flag
if a task depends on one.
- **Token transport.** Today access and refresh tokens are returned in the response body,
  stored by the FE, and sent back in the `Authorization: Bearer` header. The cookie mentions in
  `auth.controller.ts` (sign-out's `clearCookie`, the refresh/sign-out Swagger texts) are
  leftovers, not a second mechanism: don't copy or extend them.
- **`GET /users` is not paginated.** It returns every active user as a plain array
  (`users.controller.ts` → `findAll`), although the user list grows like the other paginated lists.
  Don't copy it as a pattern for new list routes.

## Current conventions
**Layering**
- Controllers: routing, guards, Swagger decorators, param/body/query validation, then ONE service call.
  No Prisma, no business logic.
- Services: business rules and Prisma calls. No repository layer. No HTTP types.

**Module layout and helpers**
- A module folder's root holds only `*.module.ts`, `*.controller.ts`, `*.service.ts` and their
  `*.spec.ts` files. Everything else goes in a subfolder by kind: `dto/` (Zod schemas and their
  types), `utils/` (module-internal helpers), `strategies/` (Passport). A new kind gets its own subfolder.
- Extract a helper that isn't the service's or controller's core concern into the module's `utils/`,
  even if it has only one user.
- `src/utils/` is for domain-free helpers used by at least two modules. A helper used by one module
  stays in that module's `utils/` until a second module needs it; then move it.

**Imports**
- Use `./` for files in the same folder or below; everything else uses a `src/…` path. No `../`.
- When a folder has an `index.ts` barrel, import from the barrel (`src/exceptions`, not
  `src/exceptions/album-not-found.exception`). Files inside that folder import each other
  directly, to avoid cycles through their own barrel. A new file in such a folder is added to its barrel.
- ESLint enforces both rules (`no-restricted-imports` in `eslint.config.mjs`). A new barrel folder
  must be added to its barrel pattern there.

**Errors**
- Services throw one of two exception kinds. Both carry a `code`, never a status.
  No `HttpException` in a `*.service.ts`.
  - `DomainException`: a business rule outcome (not found, not owned, duplicated, conflict).
  - `InfrastructureException`: a failure of something outside the business rules (storage
    write, token signing). Always 500. Its `message` reaches the client, so it must be fixed
    text, never an underlying error message or path.
- A new domain exception needs: a code in `src/constants/error-codes.ts`, a status entry in the
  registry in `src/filters/error-response.ts` (unregistered means 500), and a row in `error-response.spec.ts`.
- A new infrastructure exception needs a code in `src/constants/error-codes.ts` and a row in
  `error-response.spec.ts`; no registry entry. Log the underlying error where it's thrown.
- Error bodies come only from `AllExceptionsFilter`. No extra filters and no hand-built error bodies.
  500s never leak internals. Don't rename existing codes without checking the FE.

**Validation**
- Zod schema in the module's `dto/`, applied per parameter with `ZodValidationPipe`. `ParseIntPipe` for `:id`.
- Cross-field rules within one request go in `.refine`. Rules that need the DB go in the service.

**New routes**
- A list of user-created content (albums, stories, anything that grows per user) is cursor-paginated:
  `@Query(new ZodValidationPipe(PaginationSchema))`, `@ApiPaginationQuery()` and `@ApiPaginatedResponse(...)`
  in the controller, `findManyPaginated` + `buildPaginationArgs` in the service. Fixed reference lists
  (countries, enum values like activity types) return a plain array.
- A JSON request body is documented with `@ApiBody({ schema: zodToApiSchema(schema) })`, using the
  same schema the pipe validates with. Never hand-write it. The only exception is a multipart file
  upload, whose body has no Zod schema (see `photos.controller.ts`).

**Data**
- DTOs are camelCase and services map to snake_case columns by hand. `CamelCaseInterceptor` converts responses.
- Ownership checks go inside the Prisma `where` (`user_id`). A check followed by a write uses `$transaction`.
  If the check reads rows a concurrent request could change, lock them (`SELECT … FOR UPDATE`),
  as in `StoriesService.update`.
- Shape Prisma results with an explicit `select`/`include`. Inline is the default.
  Extract it into a module-level constant (typed with `satisfies Prisma.<Model>Select` or
  `satisfies Prisma.<Model>Include`) when it's long enough to hurt readability, or when
  two or more queries use the same shape.
- Never return sensitive columns. Today that's `User.password`. A whole row (a query without
  `select`, or `relation: true`) is allowed only for models with no sensitive columns, so a
  `User` is always read with a `select`.
- The DB stores storage keys, never URLs or paths. All file I/O goes through `StorageService`.

**Modules and auth**
- Dependencies between modules are one-way. No circular imports, no `forwardRef`.
- Nested routes (e.g. `/users/:id/albums`) live in the module that owns the returned resource, as a separate controller.
- Never list `PrismaService` in a module's `providers` (`PrismaModule` is `@Global`).
- Cross-module user lookups go through `SharedUsersService`.
- New users are always `editor`. Never accept `role` from a request body.

**Testing**
- Every service change adds or updates a unit test in `*.spec.ts` next to the code.
- Style: `@jest/globals`, `Test.createTestingModule`, typed `asyncMock()` for Prisma delegates, no DB.
  Use real libraries (argon2, JwtService) where mocking adds nothing.

## Claims about frameworks
- Don't call something "conventional", "recommended" or "best practice" from memory. Either cite
  a source you opened this session (docs.nestjs.com, prisma.io/docs, the library's own docs), with the
  URL, or the installed code in `node_modules`, or label it "from memory, unverified".
- When a question has more than one defensible answer (URL shape, module boundaries, where logic
  lives), give 2-3 options with trade-offs and a recommendation. I decide.
- Check package.json for the installed version before consulting docs.

## Working style
- Plan first for anything that touches more than one file. Keep each change to one reviewable task.
- No new layer or abstraction (repository, mapper, base class, interface) without two concrete uses today.
- The pre-commit hook runs related tests and an AI review. Never bypass it
  (`--no-verify`, `SKIP_AI_REVIEW`) unless I ask.
