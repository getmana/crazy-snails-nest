# Architecture

How this API works as of commit `340b898` (branch `master`), plus the `start:prod` path fix from branch `fix-start-prod`. Each statement cites the file it was read from (`path` or `path:line`). Where behaviour comes from a library rather than this code, that is stated explicitly.

## 1. Stack and runtime

| Concern | Technology (installed version) | Evidence |
| --- | --- | --- |
| Framework | NestJS 11.1.26 on Express (`@nestjs/platform-express`) | `package.json`, `src/main.ts:13` |
| Database / ORM | PostgreSQL via Prisma 6 (client 6.16.2, CLI 6.19.3), `prisma-client-js` generator | `prisma/schema.prisma:2,6` |
| Validation | Zod 4.4.3 | `src/pipes/zod-validation.pipe.ts` |
| Auth | Passport + `passport-jwt` 4.0.1, `@nestjs/jwt`; passwords hashed with argon2 0.44.0 | `src/modules/auth/`, `src/modules/users/users.service.ts` |
| Logging | `pino-nestjs` 0.1.3 | `src/app.module.ts:22`, `src/main.ts:15` |
| API docs | Swagger document rendered by Scalar | `src/main.ts:25-33` |
| Node | 24 | `.nvmrc` |
| Tests | Jest 30.1.3 + ts-jest 29.4.3, TypeScript 5.9.3 | `package.json` → `jest` |

## 2. Bootstrap and request lifecycle

`src/main.ts` creates the app and configures, in order:

1. The pino logger replaces Nest's logger (`src/main.ts:15`).
2. Uploaded files are served statically from `<cwd>/uploads` under the `/uploads/` prefix (`src/main.ts:17`, `FILE_UPLOAD_URL` in `src/constants/index.ts`).
3. One global exception filter, `AllExceptionsFilter`, is registered (`src/main.ts:21`). See [Error handling](#6-error-handling).
4. A global `CamelCaseInterceptor` is registered (`src/main.ts:23`).
5. The OpenAPI document is built from controller decorators and served by Scalar at `/api-docs` (`src/main.ts:33`).
6. The server listens on `PORT`, falling back to `3000` (`src/main.ts:35`).

A typical authenticated request passes through these stages:
- the guard (`AuthGuard('jwt')`, which runs the JWT strategy);
- the parameter pipes (`ParseIntPipe` and `ZodValidationPipe`);
- the controller method, then the service method, then Prisma;
- on the way out, the `CamelCaseInterceptor`.

If anything throws along the way, `AllExceptionsFilter` produces the response.

## 3. Layering

| Layer | What it does | Evidence |
| --- | --- | --- |
| Controller | Routing, Swagger decorators, guards, parsing/validation of params, query and body, then delegation to one service call | `src/modules/*/*.controller.ts` |
| Service | Business rules, ownership checks, mapping DTO fields to DB columns, Prisma calls | `src/modules/*/*.service.ts` |
| Data access | `PrismaService` extends `PrismaClient`; there is no separate repository layer | `src/modules/prisma/prisma.service.ts` |

- **No controller references Prisma.** Every Prisma use is in a service file or a module provider list: `albums.service.ts`, `notes.service.ts`, `stories.service.ts`, `users.service.ts`, `countries.service.ts`, `photos.service.ts`, `shared-users.service.ts`, `src/modules/prisma/prisma.module.ts`.
- **Module-internal helpers** live in a `utils/` folder inside the module. Example: the pure photo-layout helpers that `StoriesService` uses for its uniqueness check (`src/modules/stories/utils/index.ts`). `src/utils/` holds only cross-module, domain-free helpers (`paginate`, `camelcaseKeys`, `toJsonInput`, `zodToApiSchema`, `prismaEnumValues`, `getErrorMessage`).
- **Field naming.** Request DTOs are camelCase, and services map them to snake_case columns by hand, e.g. `title_en: titleEn` in `stories.service.ts` and `albums.service.ts`. The global `CamelCaseInterceptor` converts response keys back to camelCase (`src/interceptors/camel-case.interceptor.ts`). Its `camelcaseKeys` recurses only into arrays and plain objects (`constructor === Object`, `src/utils/camelcaseKeys.ts:7`), so values such as `Date` pass through unchanged.
- **Response shapes.** Most services return Prisma results directly, including the nested `include` trees. Examples are `storyPhotoIncludes` in `stories.service.ts` and `albumDetailIncludes` in `albums.service.ts`, both declared with `satisfies Prisma.*Include`. A few methods build the response object themselves: `UsersService.createUser` and `PhotosService.create`, which returns `CreatePhotoDto` (`src/modules/photos/dto/create-photo.dto.ts`).
- **Exceptions from services.** Services throw `DomainException` subclasses, which carry an error `code` and no HTTP status (`src/exceptions/`). No `*.service.ts` throws a Nest `HttpException` (grep over `src/modules`). HTTP statuses are assigned in the error mapper (§6).
- **Transactions.** Two update methods run inside an interactive `$transaction`:
  - `AlbumsService.update`: ownership check, preview check, note cleanup and the update (`src/modules/albums/albums.service.ts:170`).
  - `StoriesService.update` (`src/modules/stories/stories.service.ts:151`) runs these steps in order:
    1. it locks the story row with `SELECT … FOR UPDATE`, limited to the owner, through a parameterised `tx.$queryRaw` (`stories.service.ts:218-229`). A missing or foreign story throws `StoryNotFoundException`;
    2. if any photo field is sent, it checks the photos are owned and checks for cross-section duplicates (`stories.service.ts:154-157`);
    3. it applies the update.
- **Ownership checks count unique ids.** `StoriesService` deduplicates before counting (`stories.service.ts:236`), and `AlbumsService` compares the count with `new Set(albumPhotoIds).size` (`albums.service.ts:176`). A repeated owned photo is therefore never reported as not owned.
- **Compensating action.** If `photo.create` fails after the file has been saved, `PhotosService.create` deletes the file and rethrows the original DB error (`src/modules/photos/photos.service.ts:29-34`).

## 4. Authentication and authorization

- **Tokens.** `AuthService.getTokens` signs two JWTs with the payload `{ sub, email }`:
  - an access token with `JWT_SECRET`, expiring in `15m`;
  - a refresh token with `REFRESH_SECRET`, expiring in `7d`.

  Both are returned in the response body (`src/modules/auth/auth.service.ts:72-79`).
- **Strategies.** There are two Passport strategies:
  - `jwt` reads `JWT_SECRET` (`src/modules/auth/strategies/jwt.strategy.ts:17`);
  - `jwt-refresh` reads `REFRESH_SECRET` (`jwt-refresh.strategy.ts:20`).

  Both take the token from the `Authorization: Bearer` header (`jwt-refresh.strategy.ts:18`). Both look the user up on every request with `SharedUsersService.findActiveByEmail(payload.email)`, which filters `is_active: true` (`shared-users.service.ts:13-14`), and attach `{ id, email, role }` to `request.user` (`jwt.strategy.ts:22,30`). When no active user is found, the strategies throw an `UnauthorizedException` with `AUTH_USER_NOT_FOUND`. These strategies run inside the authentication guard, not in the service layer.
- **Sign-in.** The body is validated with `signInSchema` (`src/modules/auth/auth.controller.ts:40`). `validateUser` loads the active user by email and checks the password with `argon2.verify`. An unknown email and a wrong password both throw the same `InvalidCredentialsException` (`shared-users.service.ts:20`), which is returned as 401 `INVALID_CREDENTIALS`.
- **Refresh.** `POST /auth/refresh` delegates straight to `AuthService.refreshToken`, with no error handling in the controller (`auth.controller.ts:60`).
- **Sign-out.** It clears a `refresh_token` cookie, which is `secure` in production (`src/modules/auth/auth.controller.ts:72-74`).
- **Guards** (`src/guards/`):
  - `AuthGuard('jwt')`: the request must be authenticated.
  - `OptionalJwtGuard`: if a token is present, the user is attached. With no `Authorization` header, `user` is `null`. If a header is present but invalid, the request gets a 401 (`src/guards/optional-jwt.guard.ts`). It's used on public read routes so owners can see their unpublished content, e.g. `GET /albums/:id` and `GET /stories/:id`.
  - `RolesGuard` together with `@Roles(...)`: reads the route's roles metadata through `Reflector` and returns 403 `INSUFFICIENT_PERMISSIONS` (`src/guards/roles.guard.ts`, `src/decorators/roles.decorator.ts`). It's used on `DELETE /users/:id` (`src/modules/users/users.controller.ts:90-91`).
  - `SelfOrAdminGuard`: allows the request when the user is an admin or `user.id === +params.id` (`src/guards/self-or-admin.guard.ts:27`). It's used on `PATCH /users/:id`.
- **Current user.** `@CurrentUser()` reads `request.user` (`src/decorators/current-user.decorator.ts`). Its type comes from a module augmentation of Express's `Request` (`src/@types/express/index.d.ts`).
- **Roles.** New users are always created with `Role.editor` (`src/modules/users/users.service.ts:23`). `CreateUserDto` has no `role` field (`src/modules/users/dto/users.dto.ts`).
- **Ownership rules** are applied inside the Prisma `where` clauses. For example, `where: { id, user_id: userId }` on updates; on deletes, `user_id` is omitted for admins (`albums.service.ts`, `stories.service.ts` → `remove`).
- **Unpublished content** is reported to non-owners as not found. `EntityNotPublished` maps to 404, and its messages read "… with id N not found" (`albums.service.ts`, `stories.service.ts`, `notes.service.ts`).

## 5. Validation

| What is validated | Mechanism | Evidence |
| --- | --- | --- |
| Request body and query | A Zod schema from the module's `dto/` folder, passed to `ZodValidationPipe`, which calls `schema.parse(value)` | `src/pipes/zod-validation.pipe.ts:9` |
| Where the pipe is applied | Per parameter, e.g. `@Body(new ZodValidationPipe(UpdateAlbumSchema))`, `@Body(new ZodValidationPipe(signInSchema))`, `@Query(new ZodValidationPipe(PaginationSchema))`. `POST /users` applies it to the whole method via `@UsePipes` | `albums.controller.ts`, `stories.controller.ts`, `auth.controller.ts:40`, `users.controller.ts:42` |
| Path params | `ParseIntPipe` | all controllers with `:id` routes |
| Pagination | `PaginationSchema`: `cursor` coerced to a positive int; `limit` coerced, between 1 and 100, defaulting to 20 | `src/dto/pagination.dto.ts:4-5` |
| Cross-field rules (within one request) | `.refine` on the schema: photo ids unique and the preview photo among them (`update-album.dto.ts:37,46`); photo ids unique across all story sections (`update-story.dto.ts:29`); `titleEn` or `titleUk` required (`create-album.dto.ts:20`, `create-story.dto.ts:9`) | listed |
| Rich text | `TiptapDocumentSchema`: `{ type: 'doc', content: any[] }` | `src/dto/tiptap.dto.ts` |
| Uploaded file | `ParseFilePipe` with three validators: `MaxFileSizeValidator` (10 MB), `FileTypeValidator`, and `ImageExtensionValidator` (`.jpg`, `.jpeg`, `.png`, `.webp`, case-insensitive) | `src/modules/photos/photos.controller.ts:60-66`, `src/constants/index.ts:3-4`, `src/pipes/image-extension.validator.ts` |
| Business rules | Checked in services: photo ownership (`albums.service.ts:172-176`, `stories.service.ts:231-245`); story photo uniqueness against the **stored** sections (`stories.service.ts:247-265`); note ownership (`notes.service.ts:18`); active user (`shared-users.service.ts` → `assertActiveUser`); email/username uniqueness (`users.service.ts` → `findExistingUser`) | listed |

- Zod's `parse` throws `ZodError` on invalid input, which the error mapper turns into 400 `VALIDATION_FAILED` (§6).
- In Nest 11, `FileTypeValidator` checks the file's content by its magic bytes (library behaviour: `node_modules/@nestjs/common/pipes/file/file-type.validator.js`).
- **Story photo uniqueness is checked in two places.**
  - The DTO refine rejects duplicates inside one request with a 400.
  - `StoriesService.update` then builds the story's photo layout as it will be after the update: sections sent in the request replace the stored ones, omitted sections keep their stored photos, and a hero sent as `null` clears the stored hero (`src/modules/stories/utils/index.ts:41-56`). Any id appearing twice gives `StoryPhotoDuplicatedException` → 422.
- Swagger request bodies are generated from the Zod schemas with `z.toJSONSchema`, mapping `ZodDate` to `string`/`date-time` (`src/utils/zodToApiSchema.ts`).

## 6. Error handling

Two exception hierarchies exist:
- `DomainException` (`src/exceptions/domain.exception.ts`): an abstract base class requiring a `code` (line 2), with `name` set from the subclass (line 6). Every file in `src/exceptions/` except `file-write.exception.ts` extends it.
- `FileWriteException` extends `Error` directly and keeps its code in a **static** field (`src/exceptions/file-write.exception.ts:4`). Its message is the fixed text "Failed to save file" (`src/modules/shared/storage/storage.service.ts:36`).

**One filter, one response shape.** `AllExceptionsFilter` is decorated with `@Catch()`, so it catches everything (`src/filters/all-exceptions.filter.ts:6`). It passes the error to the pure function `toErrorResponse` (`src/filters/error-response.ts:103`) and writes the result as both the HTTP status and the JSON body (`all-exceptions.filter.ts:23`). Every error response has the shape `{ statusCode, code, message }` (`ErrorResponse`, `error-response.ts:22`).

| Thrown | Status | `code` | `message` | Evidence |
| --- | --- | --- | --- | --- |
| `ZodError` | 400 | `VALIDATION_FAILED` | issue messages joined with `'. '` | `error-response.ts:28,104` |
| `AlbumNotFound`, `StoryNotFound`, `NoteNotFound`, `ActiveUserNotFound`, `EntityNotPublished` | 404 | the exception's `code` | the exception's message | `error-response.ts:38` (registry), `:72` |
| `PhotoNotOwned` | 403 | ″ | ″ | ″ |
| `PreviewPhotoInvalid`, `StoryPhotoDuplicated`, `CountryCodesNotFound` | 422 | ″ | ″ | ″ |
| `UserAlreadyExists` | 409 | ″ | ″ | ″ |
| `InvalidCredentials` | 401 | ″ | ″ | ″ |
| `TokenGenerationFailed` | 500 | ″ | ″ | ″ |
| A `DomainException` subclass missing from the registry | 500 | `INTERNAL_SERVER_ERROR` | `'Internal server error'` | `error-response.ts:30,72` |
| `FileWriteException` | 500 | `FILE_WRITE_TO_STORAGE_ERROR` | its message | `error-response.ts:119` |
| Prisma `P2025` / `P2002` | 404 / 409 | `RECORD_NOT_FOUND` / `UNIQUE_CONSTRAINT_VIOLATION` | fixed text | `error-response.ts:53,127` |
| Any other Prisma known-request error | 500 | `INTERNAL_SERVER_ERROR` | `'Internal server error'` | `error-response.ts:127` |
| `HttpException` (guards, strategies, `ParseIntPipe`, `ParseFilePipe`, unknown routes, Multer limits) | `getStatus()` | the response's `code` if it carries one, otherwise the status name from `HttpStatus` (e.g. `UNAUTHORIZED`, `NOT_FOUND`, `PAYLOAD_TOO_LARGE`) | the response's `message`; an array is joined with `'. '` | `error-response.ts:85-101,131` |
| Anything else | 500 | `INTERNAL_SERVER_ERROR` | `'Internal server error'` | `error-response.ts:30` |

- **Statuses for domain exceptions** live in the mapper's registry, not on the exception classes (`error-response.ts:38`). The registry is searched with `instanceof`, so subclasses inherit their parent's status.
- **The status-name fallback** uses the reverse mapping of Nest's numeric `HttpStatus` enum (`HttpStatus[statusCode]`, `error-response.ts:88`). For example, `HttpStatus[401]` is `'UNAUTHORIZED'` (library behaviour).
- **Multer limit errors** are converted to `PayloadTooLargeException` by `@nestjs/platform-express` (library behaviour: `node_modules/@nestjs/platform-express/multer/multer/multer.utils.js:13`), so they reach the `HttpException` branch.
- **Logging.** The filter logs only responses whose code is `INTERNAL_SERVER_ERROR` (`all-exceptions.filter.ts:13`): unknown errors, unregistered domain exceptions and unhandled Prisma codes. `TokenGenerationFailedException` and `FileWriteException` are logged where they're thrown (`auth.service.ts`, `storage.service.ts`).
- **List endpoints:** `findManyPaginated` converts a `P2025` from the list query into an empty page `{ items: [], nextCursor: null }` (`src/utils/paginate.ts:36`).

Error codes are defined centrally in `src/constants/error-codes.ts`. The status-name codes (e.g. `BAD_REQUEST`) are not listed there; they come from `HttpStatus`.

## 7. Module dependencies

```
AppModule
├── ConfigModule.forRoot({ isGlobal: true })        (global)
├── LoggerModule.forRoot(pino)
├── PrismaModule                                    (@Global → PrismaService)
├── StorageModule                                   (→ StorageService)
├── UsersModule
├── CountriesModule                                 (exports CountriesService)
├── AuthModule ──────────┐
├── AlbumsModule ────────┼──► SharedModule          (→ SharedUsersService)
├── StoriesModule ───────┘
└── PhotosModule ──► StorageModule, PrismaModule
```

| Module | Imports | Providers | Exports | Evidence |
| --- | --- | --- | --- | --- |
| `AppModule` | Config (global), Countries, Users, Prisma, Auth, Albums, Storage, Logger, Photos, Stories | — | — | `src/app.module.ts:14-32` |
| `PrismaModule` (`@Global`) | — | `PrismaService` | `PrismaService` | `src/modules/prisma/prisma.module.ts:4-7` |
| `SharedModule` | — | `SharedUsersService` | `SharedUsersService` | `src/modules/shared/users/shared.module.ts:5-6` |
| `StorageModule` | — | `StorageService` | `StorageService` | `src/modules/shared/storage/storage.module.ts` |
| `AuthModule` | Shared, Passport, `JwtModule.registerAsync` | `AuthService`, `JwtStrategy`, `JwtRefreshStrategy` | — | `src/modules/auth/auth.module.ts` |
| `AlbumsModule` | Shared | `AlbumsService`, `NotesService` | `AlbumsService` | `src/modules/albums/albums.module.ts` |
| `StoriesModule` | Shared | `StoriesService` | `StoriesService` | `src/modules/stories/stories.module.ts` |
| `PhotosModule` | Storage, Prisma | `PhotosService` | — | `src/modules/photos/photos.module.ts:10` |
| `UsersModule` | — | `UsersService` | — | `src/modules/users/users.module.ts` |
| `CountriesModule` | — | `CountriesService` | `CountriesService` | `src/modules/countries/countries.module.ts` |

- **`PrismaService` is a single instance** shared by every module, because `PrismaModule` is `@Global` and no other module registers `PrismaService` in its own `providers`. `PhotosModule` also imports `PrismaModule` explicitly (`photos.module.ts:10`).
- **Cross-module service use goes through `SharedUsersService`**, which `AuthService`, `AlbumsService` and `StoriesService` inject (constructors in their service files).
- **Some exports have no importer.** `AlbumsService`, `StoriesService` and `CountriesService` are exported, but no other feature module imports their modules (`grep` for each module name across `src/modules/*/**.module.ts`).
- **User-scoped list routes live with the resource they return.** `GET /users/:id/albums` is defined in `AlbumsModule` (`src/modules/albums/user-albums.controller.ts:9`) and `GET /users/:id/stories` in `StoriesModule` (`src/modules/stories/user-stories.controller.ts:9`). Both controllers use `@Controller('users')`. Both routes call `assertActiveUser` before listing, via `findManyByUser` in the respective services.
- **Notes** are served under albums (`/albums/:id/photos/:photoId/note`), by `NotesService` in `AlbumsModule` (`src/modules/albums/albums.controller.ts:160-232`, `src/modules/albums/notes.service.ts`).

## 8. Configuration and logging

- `ConfigModule` is global (`src/app.module.ts:15`), so `ConfigService` can be injected anywhere.
- JWT secrets are read with `ConfigService.getOrThrow` (`auth.module.ts:18`, `auth.service.ts:73,77`, `jwt.strategy.ts:17`, `jwt-refresh.strategy.ts:20`).
- `PORT` (`src/main.ts:35`) and `NODE_ENV` (`src/app.module.ts:25`, `src/modules/auth/auth.controller.ts:74`) are read from `process.env`.
- The Prisma CLI loads `.env` through `dotenv/config` (`prisma.config.ts:1`).
- Logging uses pino through `LoggerModule.forRoot`, formatted with `pino-pretty` when `NODE_ENV !== 'production'` (`src/app.module.ts:22-28`).
  - `AuthService` and `StorageService` inject a context logger with `@InjectPinoLogger` (`auth.service.ts:26`, `storage.service.ts:11`).
  - `AllExceptionsFilter` uses Nest's `Logger` (`src/filters/all-exceptions.filter.ts:8`), which goes to pino because of `app.useLogger` (`src/main.ts:15`).

## 9. Testing approach

- **Runner.** Jest is configured in `package.json` → `jest`:
  - `rootDir: src`, and test files match `*.spec.ts`;
  - TypeScript runs through `ts-jest` with `transpilation: true`, so Jest itself does not type-check;
  - `moduleNameMapper` maps `^src/(.*)$` to `<rootDir>/$1`;
  - the environment is `node`.
- **Type-checking specs.** `npm run typecheck` (`tsc --noEmit -p tsconfig.json`) type-checks spec files, because `tsconfig.json` includes `src/**/*.ts`. The production build (`tsconfig.build.json`) excludes `**/*spec.ts` and `src/testing`.
- **Globals.** Specs import `describe`, `it`, `expect`, `jest`, etc. from `@jest/globals`. `tsconfig.json` sets `types: ["node"]`, so no global Jest types are loaded.
- **Scope.** Only unit tests exist: 15 suites and 160 tests (from `npx jest --ci` at `340b898`). There are no integration or e2e tests, no tests use a database, and no controller has a spec.
- **Style.**
  - Services are built with `Test.createTestingModule`, with collaborators replaced through `{ provide: X, useValue: mock }`. Prisma delegates are mocked with `asyncMock()`, a typed `jest.fn<(...args: unknown[]) => Promise<unknown>>()` (`src/testing/jest-mocks.ts`).
  - Interactive transactions are tested by mocking `$transaction` to call the callback with a `mockTx` object (`albums.service.spec.ts`, `stories.service.spec.ts`). The stories spec checks the lock query runs first using Jest's `invocationCallOrder`.
  - Guards and the exception filter are tested with Nest's real `ExecutionContextHost`, wrapped by `createHttpContext(request, response?)` (`src/testing/http-context.ts`).
  - The error mapper is a pure function and is tested table-driven, one case per mapping row, with `toStrictEqual` on the full body (`src/filters/error-response.spec.ts`).
  - Some specs use real libraries instead of mocks:
    - argon2 hashing in `shared-users.service.spec.ts` and `users.service.spec.ts`;
    - a real `JwtService`, whose tokens are decoded in `auth.service.spec.ts`;
    - `fs.promises` spies plus fake timers in `storage.service.spec.ts`.
  - Parameterised cases use `it.each` / `describe.each`, e.g. `image-extension.validator.spec.ts`, `jwt.strategies.spec.ts` and `error-response.spec.ts`.
- **Spec files:**
  - Filters: `src/filters/all-exceptions.filter.spec.ts`, `error-response.spec.ts`
  - Guards: `src/guards/optional-jwt.guard.spec.ts`, `roles.guard.spec.ts`, `self-or-admin.guard.spec.ts`
  - Pipes: `src/pipes/image-extension.validator.spec.ts`
  - Albums: `src/modules/albums/albums.service.spec.ts`
  - Auth: `src/modules/auth/auth.service.spec.ts`, `strategies/jwt.strategies.spec.ts`
  - Countries: `src/modules/countries/countries.service.spec.ts`
  - Photos: `src/modules/photos/photos.service.spec.ts`
  - Shared: `src/modules/shared/storage/storage.service.spec.ts`, `src/modules/shared/users/shared-users.service.spec.ts`
  - Stories: `src/modules/stories/stories.service.spec.ts`
  - Users: `src/modules/users/users.service.spec.ts`

## 10. Commands and automation

### npm scripts (`package.json` → `scripts`)

| Script | Runs |
| --- | --- |
| `build` | `nest build`, which uses `tsconfig.build.json`; `nest-cli.json` deletes `dist/` first. Output goes to `dist/src/` (and `dist/prisma/`), because `tsconfig.json` also includes `prisma/seeds` |
| `start` / `start:dev` / `start:debug` | `nest start`, plus `--watch` / `--debug --watch` |
| `start:prod` | `node dist/src/main` |
| `lint` | `eslint "src/**/*.ts" --fix` |
| `lint:check` | `eslint "src/**/*.ts"` (no fixes; used in CI) |
| `typecheck` | `tsc --noEmit -p tsconfig.json` (app code and specs) |
| `format` | `prettier --write "src/**/*.ts"` |
| `test` / `test:watch` / `test:cov` | `jest`, plus `--watch` / `--coverage` (output in `coverage/`) |
| `test:debug` | Jest under `node --inspect-brk`, in band |
| `review:staged` | `bash scripts/ai-review.sh` |
| `prepare` | `husky`, which installs the git hooks on `npm install` |

### Database (Prisma CLI, configured by `prisma.config.ts`)

- Schema: `prisma/schema.prisma`.
- Migrations: `prisma/migrations/`, with 19 migrations at `340b898`.
- `npx prisma migrate dev` applies and creates migrations, and `npx prisma generate` regenerates the client.
- `npx prisma db seed` runs `ts-node prisma/seed.ts` (`prisma.config.ts:8`), which seeds countries (`prisma/seeds/countries.seed.ts`).

### Pre-commit hook (`.husky/pre-commit`)

1. `lint-staged` runs `eslint --fix` and `jest --findRelatedTests --passWithNoTests` on the staged `*.ts` files (`package.json` → `lint-staged`).
2. `npm run --silent review:staged` (`scripts/ai-review.sh`):
   - It skips itself when `SKIP_AI_REVIEW=1` is set, when the Claude CLI (`CLAUDE_BIN`, default `claude`) isn't found, when there's no terminal, or when nothing is staged.
   - Otherwise it runs `claude -p "/code-review ${AI_REVIEW_LEVEL:-low}"` with the tools limited to `Read,Grep,Glob,Skill,Bash`, pre-approves only read-only tools and `git diff/log/show/status`, and uses `--permission-mode dontAsk`.
   - It then asks `Proceed with commit? [y/N]`.

### CI (`.github/workflows/ci.yml`)

- **Triggers:** pull requests to `master` and pushes to `master`.
- **Settings:** `permissions: contents: read`, and a concurrency group per ref that cancels in-progress runs.
- **Job:** `lint-build-test` on `ubuntu-latest`, with a 10-minute timeout. It uses `actions/checkout@v7` and `actions/setup-node@v7`, which takes the Node version from `.nvmrc` and caches npm. Steps, in order:
  1. `npm ci` (with `HUSKY=0`)
  2. `npx prisma generate`
  3. `npm run lint:check`
  4. `npm run typecheck`
  5. `npm run build`
  6. `npm test -- --ci`

### Lint configuration (`eslint.config.mjs`)

`@eslint/js` recommended, `typescript-eslint` `recommendedTypeChecked` with `projectService: true`, and `eslint-plugin-prettier`. Three rules are overridden (`eslint.config.mjs:28-32`):
- `no-explicit-any` is turned off;
- `no-floating-promises` is a warning;
- `no-unsafe-argument` is a warning.

`lint:check` currently reports one warning: `no-floating-promises` on the unawaited `bootstrap()` call (`src/main.ts:37`).
