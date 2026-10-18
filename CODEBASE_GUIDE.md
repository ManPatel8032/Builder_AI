# BuilderAI codebase and responsive-layout guide

This guide describes the first-party application code in this repository. It
covers the responsive behavior of the BuilderAI interface and the files and
functions in `server/`. Third-party files under `node_modules/` are excluded.
The local `server/.env` is intentionally not documented or reproduced; use
`server/.env.example` as the safe configuration reference.

## How the website responds to screen size

### In short

The BuilderAI interface is mostly **Flexbox plus Tailwind CSS responsive
utilities**. The inspected client source does not use CSS Grid classes or
handwritten `@media` rules for its page layouts. The `sm:`, `md:`, `lg:`, and
`xl:` variants change styles at Tailwind breakpoints. Most content grows into
available space but is constrained with maximum widths; a few areas use fixed
dimensions or viewport-relative heights where a stable workspace is useful.

The websites users generate inside BuilderAI are separate React projects. Their
layout depends on the generated project files. The server's AI prompts request
mobile-first responsive designs, but those generated websites do not use the
BuilderAI shell's layout rules automatically.

### What makes the main screens adapt

- **Browser viewport:** `client/index.html` declares
  `width=device-width, initial-scale=1.0`, so CSS pixels and breakpoints are
  based on the device viewport instead of a scaled desktop-width page.
- **Global sizing and styling:** `client/src/index.css` imports Tailwind CSS v4,
  sets `box-sizing: border-box` globally, and establishes the font stack and
  base colors. Most layout and text styles are Tailwind utilities in JSX.
- **Flexible containers:** `flex`, `flex-col`, `flex-1`, `items-center`,
  `justify-between`, and `min-w-0` let elements share and constrain available
  space without relying on fixed page widths.
- **Fluid width with caps:** Patterns such as `w-full max-w-2xl` fill a narrow
  screen while limiting line length on larger displays. `max-w-sm` and similar
  constraints keep forms and cards readable.
- **Breakpoint-specific layouts:** For example, `md:flex-row` changes the
  builder from a vertical mobile arrangement to a horizontal desktop
  workspace. `md:w-[320px]` makes its desktop sidebar a fixed 320px while the
  preview takes the remaining width.
- **Selective fixed and relative dimensions:** The builder fills the viewport
  with `h-screen`; its mobile sidebar uses `h-[46vh]`, and on desktop its height
  is allowed to follow the parent. The header has a compact fixed height
  (`h-12`). This mixes viewport-relative sizing with fixed component sizing
  and flex-driven remainder sizing rather than sizing every element as a
  percentage.
- **Responsive typography:** Text size changes at breakpoints rather than
  continuously scaling. The home hero uses `text-4xl md:text-6xl`; its
  supporting text changes from `text-sm` to `md:text-base`. Max-widths and
  centered alignment help prevent overly long lines.
- **Reduced mobile chrome:** The builder header progressively hides button
  labels (`hidden sm:inline`, `hidden md:inline`) to preserve room. The
  authentication branding panel is hidden below `lg`, leaving the form to use
  the full width.
- **Contained scrolling:** Areas such as chat, file lists, and project lists
  scroll internally; `overflow-hidden`, `min-h-0`, and `overflow-y-auto` help
  nested flex layouts fit without forcing the entire workspace to overflow.

### Builder layout by device

In `client/src/pages/BuilderPage.jsx`, the workspace is a full-height flex
column with a fixed header and a flexible main section:

| Screen | Left area | Preview/code area |
|---|---|---|
| Mobile (below `md`) | Full-width, approximately 46% of viewport height; Chat and Files tabs share this area. | Hidden unless the user selects the mobile-only Preview tab, then shown full-height in the remaining workspace. |
| `md` and wider | Fixed 320px sidebar, always visible. | Visible beside it and grows to fill remaining width. |

This tab switch is an intentional alternative to squeezing chat, files, and a
code preview side-by-side on a phone. The code editor and preview themselves
share space with flex ratios when both are enabled.

### Examples from other screens

- `client/src/pages/homepage.jsx`: centered, max-width content; hero typography
  increases at `md`; project cards use flexible rows and truncate long titles.
- `client/src/pages/AuthPage.jsx` and `client/src/components/LoginLeft.jsx`:
  the form is capped at `max-w-sm`; the decorative left panel appears only at
  `lg` and above.
- `client/src/components/AgentProgressDashboard.jsx`: a full-width wrapper
  centers a `max-w-xl` card; padding increases at `md`.
- `client/src/components/BuilderHeader.jsx`: the project name truncates at
  responsive maximum widths and action labels are hidden as the viewport
  narrows.

### Practical conclusion

The good fit across laptop and phone sizes mainly comes from the combination
of a mobile-first default, flex containers, breakpoint overrides, capped
content widths, selective viewport sizing, and removing or tabbing secondary
controls on small screens. It is **not primarily based on CSS Grid**, and the
typography is **not fluid via `clamp()`** in the inspected client styles.

## Server overview

`server/server.js` starts Express, connects to MongoDB, installs CORS, cookie,
and JSON middleware, mounts the route groups, and starts listening. Authenticated
routes use an HTTP-only JWT cookie, and project data is associated with its
owner. The AI service plans files, generates them, normalizes and validates
code, then the project controller records the progress and results.

### Server file and function reference

#### Entry point and configuration

- **`server/server.js`** — Application bootstrap.
  - Top-level startup: loads environment variables, creates the Express app,
    connects to MongoDB, configures CORS/cookies/JSON parsing, mounts routes,
    and starts the HTTP listener.
  - `GET /`: inline route handler responds with a simple liveness message.
  - Final error middleware: logs an error message and returns an HTTP 500 JSON
    response for errors passed through Express middleware.
- **`server/config/db.js`** — MongoDB connection setup.
  - `connectToDatabase()`: subscribes to Mongoose's `connected` event for a
    success log, then connects using `MONGODB_URI`.
- **`server/.env.example`** — Placeholder template for runtime configuration:
  `PORT`, MongoDB URI, JWT secret, allowed browser origins, OpenRouter API key
  and model, and AI concurrency. Copy placeholders into a private local
  `server/.env` and replace them; do not commit real credentials.
- **`server/package.json`** — Server package metadata and commands:
  `npm run start` launches Node, and `npm run dev` launches Nodemon. It declares
  Express, Mongoose, JWT/cookie/auth dependencies, and the AI SDK dependencies.
- **`server/package-lock.json`** — npm's resolved dependency tree and versions.
  It is generated package-manager metadata; it defines no application
  functions.

#### Routes and authentication

- **`server/routes/authRoutes.js`** — Maps the authentication URL paths:
  - `POST /api/auth/register` → `register`
  - `POST /api/auth/login` → `login`
  - `POST /api/auth/logout` → `logout`
  - `GET /api/auth/me` → `authMiddleware`, then `me`
  - The router itself groups and exports these endpoints.
- **`server/controllers/authController.js`** — Authentication request handlers.
  - `setSessionCookie(res, payload)`: signs a JWT with a 30-day expiry and
    places it in an HTTP-only cookie; `secure` depends on production mode and
    `sameSite` is `lax`.
  - `register(req, res)`: validates required fields, normalizes the email,
    checks for an existing user, bcrypt-hashes the password value received
    from the client, creates the user, sets the session cookie, and returns
    the user's public fields.
  - `login(req, res)`: validates email/password, looks up the normalized
    email, compares the submitted password value with the stored bcrypt hash,
    and on success sets a cookie and returns the public user fields.
  - `logout(_req, res)`: expires the session cookie and returns success.
  - `me(req, res)`: finds the authenticated user's record, excludes the
    password field, and returns the user or an appropriate auth/not-found
    response.
- **`server/middleware/authMiddleware.js`** — Protects routes using the JWT
  cookie.
  - `authMiddleware(req, res, next)`: rejects requests with no token, verifies
    a token and attaches its decoded payload as `req.user`, then calls `next`;
    invalid or expired tokens receive a 403 response.
- **`server/models/user.js`** — Mongoose User schema and model.
  - `UserSchema.methods.comparePassword(password)`: uses bcrypt to compare an
    incoming password value to the stored hash.
  - `User`: exported Mongoose model with name, normalized unique email,
    password hash, and timestamps. The schema intentionally has no password
    save hook; hashing is performed by the auth controller.

#### Project routes, controller, and model

- **`server/routes/projectRoutes.js`** — Maps project endpoints:
  - `GET /api/projects/public/:id` is public and calls `getPublicProject`.
  - All routes registered after `ProjectRouter.use(authMiddleware)` require
    authentication:
    `POST /` creates; `GET /` lists; `GET /:id` reads; `DELETE /:id` deletes;
    `PUT /:id` and `PUT /:id/files` update files; `POST /:id/publish`
    publishes; `POST /:id/chat` requests an AI revision.
- **`server/controllers/projectController.js`** — Project lifecycle and CRUD.
  - `hashContent(content)`: creates a short 12-character MD5-derived content
    identifier used as file metadata, not as a security credential.
  - `createProject(req, res)`: validates the prompt and authenticated user,
    stores a pending project with initial messages/progress fields, starts
    generation in the background, and immediately returns the initial project.
  - `runBackgroundGeneration(projectId, prompt)`: runs the AI generation job.
    Its `onPlan` callback saves the project name, plan, status, and plan
    message; `onFileStart` records the active file; `onFileComplete` stores
    each file and hash, records completion, and saves progress. On success it
    marks the project complete and sets its version; on failure it records a
    failed status, error text, and assistant message.
  - `listProjects(req, res)`: returns the current owner's project summaries,
    newest-updated first.
  - `getProject(req, res)`: finds one project owned by the current user,
    unwraps stored file content into a path-to-source map, and returns project
    and generation state.
  - `deleteProject(req, res)`: deletes only a project matching both the id and
    authenticated owner.
  - `updateProjectFiles(req, res)`: validates the submitted files object,
    retains string-valued files, computes hashes, saves the map, and returns
    the updated project data.
  - `publishProject(req, res)`: marks an owned project as public and returns
    the published flag.
  - `getPublicProject(req, res)`: returns the public project fields and source
    files only if the project exists and has been published.
- **`server/models/project.js`** — Mongoose project schema and model.
  - `MessageSchema`: describes user/assistant messages with content and
    timestamp.
  - `PlannedFileSchema`: describes a planned source file by path and purpose.
  - `ProjectSchema`: stores name, description, files, chat history, version,
    owner, publish state, generation status/progress, error, and timestamps.
  - `Project`: exported Mongoose model.

#### AI generation and code processing

- **`server/services/ai.js`** — OpenRouter/Vercel AI SDK integration.
  - `generateSingleFile(file, allFiles, prompt, alreadyGeneratedFiles)`:
    creates the file-specific system instructions, asks the model for code
    matching `FileCodeSchema`, normalizes the response, rejects empty output,
    validates/repairs common issues, and returns the file path and code.
  - `generateProject(prompt, callbacks)`: first requests a file plan and
    ensures `/App.js` and `/styles.css` are present. It calls `onPlan`, then
    generates files in bounded parallel batches with retry rounds; progress
    callbacks are awaited, failed files are logged and may receive placeholder
    source, and absence of `/App.js` ultimately fails the job.
  - `reviseProject(prompt, manifest, relevantFiles, recentMessages)`: builds a
    prompt from the file manifest, file contents, recent conversation, and
    revision request; asks the model for structured operations; normalizes
    operation names/paths and content; and validates newly created or replaced
    code before returning the revision description and operations.
- **`server/services/aiSchemas.js`** — Zod output schemas used to validate
  structured model results.
  - `GenerationResultSchema`: file map plus a description.
  - `FileOpSchema`: create/update/delete operation fields.
  - `RevisionResultSchema`: list of operations plus revision description.
  - `FilePlanSchema`: planned file paths, descriptions, import/export
    contracts, and project naming/description.
  - `FileCodeSchema`: generated source code string.
- **`server/services/prompts.js`** — Centralized system instructions for
  generated and revised projects.
  - `BASE_SYSTEM`: shared requirements covering app-vs-landing-page intent,
    design, accessibility/structure, responsive Tailwind usage, and coding
    conventions.
  - `REVISE_SYSTEM`: instructs the model to return minimal create/update/delete
    operations for an existing project.
  - `FILE_PLAN_SYSTEM`: requests the project file plan and import/export
    contracts.
  - `buildFileCodeSystem(allFiles, alreadyGeneratedFiles)`: combines shared
    instructions with the plan and already-generated source context to create
    instructions for producing one file at a time.
- **`server/services/contentNormalizer.js`** — Repairs common escaped output
  problems in model-generated content.
  - `normalizeContent(content)`: handles empty content, removes a BOM,
    normalizes line endings and some escaped newlines/quotes, and returns
    normalized code.
- **`server/services/codeValidator.js`** — Applies cautious regex-based
  repairs to generated JSX/JS/CSS and import paths.
  - `validateAndFixCode(code, filePath, context)`: strips code fences, applies
    CSS formatting, fixes common JSX attributes and void-element syntax,
    attempts to ensure a default export and React import, removes HTML comments
    and certain TypeScript syntax, and can repair relative imports against the
    planned file list. Returns repaired code and warning messages.
  - `validateRevisionContent(content, filePath, op)`: applies the full
    validator to created content, skips deletes, and limits fixes on partial
    update replacements to safer JSX attribute and void-element corrections.
  - `getDir(p)`: gets the containing directory of a project path.
  - `resolvePath(baseDir, relativePath)`: resolves `.` and `..` segments into
    an absolute-style project path.
  - `getRelativePath(fromDir, toPath)`: computes a relative import path
    between two project paths.
  - `cleanExtension(p)`: removes supported JS/TS/CSS source extensions for
    path comparisons.
  - `fixImportPaths(code, filePath, allPlannedFiles)`: identifies relative
    imports that do not match planned paths, attempts to find the same filename
    in the plan, and rewrites matching import targets; returns code and
    warnings.
- **`server/services/diff.js`** — Applies AI-requested file operations.
  - `hashContent(content)`: computes the same short MD5-derived content
    identifier format used for file metadata.
  - `applyOperations(currentFiles, operations)`: copies the current file map,
    applies create/update/delete operations, recalculates hashes, and returns
    the updated map plus applied-operation and error lists.
  - `searchReplace(content, search, replace)`: tries exact replacement first,
    then uses normalized whitespace and line matching to find a patch block;
    returns `null` when no match is found.

#### Chat revisions

- **`server/controllers/chatController.js`** — Handles project revision chats.
  - `buildManifest(files)`: maps each file path to its stored hash and content
    length for compact AI context.
  - `chat(req, res)`: validates the prompt and authentication, fetches the
    owned project, marks it as revising and records the user message, invokes
    `reviseProject`, applies the returned operations, updates version/status
    and assistant response, saves the project, and returns the updated files
    and operation results. On an AI/revision error, it restores the completed
    status and returns an error response.

## Typical backend request flows

1. **Login or registration:** auth route → auth controller → User model →
   JWT session cookie.
2. **Create a project:** authenticated project route → `createProject` stores
   a pending record and responds → background generation plans and produces
   files, saving progress and completion to MongoDB.
3. **Edit or publish:** authenticated route checks both project id and owner;
   file edits are normalized into content/hash entries, while publish toggles
   the public flag.
4. **Public project view:** public route reads by id and returns source only
   for a published project.
5. **Ask for a revision:** authenticated chat route builds AI context,
   requests operations, applies targeted changes, and persists the result.

## Configuration notes

- `PORT`: Express listening port (defaults to 3000 in `server.js`).
- `MONGODB_URI`: MongoDB connection string used by `connectToDatabase()`.
- `JWT_SECRET`: signing and verification key for session JWTs. Configure a
  private strong value; the source has a development fallback if it is absent.
- `ORIGINS`: comma-separated browser origins accepted by CORS.
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`: AI provider credentials and model.
- `AI_MAX_CONCURRENCY`: maximum parallel file generations; the service uses 6
  if unset.

This is documentation of current implementation behavior, not a guarantee that
every generated user website is responsive or that all model output will
compile without review.
