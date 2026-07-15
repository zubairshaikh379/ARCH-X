// ─────────────────────────────────────────────────────────────────────────────
// API SECURITY — DEEP GUIDEBOOK (textbook-grade course, mirrors soc-analyst pilot)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → API Foundations → OWASP map →
// Core flaws (BOLA, auth, data exposure, resource limits, misconfig) →
// Tokens/keys → Injection → Gateways/WAF & defensive design. Each lesson ends
// with an 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the api-security course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort reading a URL and an HTTP request — you've seen a browser's network tab, even if you didn't linger.",
    "A mental model of client→server: something asks, something answers, over TCP/443.",
    "Basic JSON literacy (you can tell an object from an array) — no coding fluency required.",
    "No prior security experience needed — every concept is built up from zero.",
  ],
  learningOutcomes: [
    "Read a raw HTTP request/response and name every part: method, path, headers, auth, body, status.",
    "Recognise all ten OWASP API Security Top 10 (2023) risks by their real-world symptom, not just their acronym.",
    "Spot Broken Object Level Authorization (BOLA/IDOR) by reasoning about who owns the object being requested.",
    "Tell broken authentication apart from broken authorization — and explain why the fix differs.",
    "Explain how excessive data exposure and mass assignment leak or corrupt data the client never should touch.",
    "Design layered API defences: gateway, rate limiting, schema validation, scoped tokens, and least privilege.",
  ],
  mustKnow: [
    "REST", "GraphQL", "HTTP methods", "Status codes", "OWASP API Top 10 (2023)",
    "API1 BOLA / IDOR", "API2 Broken Authentication", "API3 BOPLA", "Mass Assignment",
    "Excessive Data Exposure", "API4 Resource Consumption", "Rate Limiting", "API5 BFLA",
    "API7 SSRF", "API8 Misconfiguration", "JWT", "OAuth 2.0", "API keys vs tokens",
    "Injection", "Input validation", "API Gateway", "WAF", "Least Privilege",
    "T1190 Exploit Public-Facing App", "T1078 Valid Accounts",
  ],
  commonGaps: [
    "Authentication vs authorization. Beginners collapse the two; nearly every catastrophic API breach is an AUTHORIZATION failure on an authenticated request.",
    "Object vs function level. BOLA is 'can I touch THIS record?'; BFLA is 'can I call THIS admin action?'. They fail independently and need separate checks.",
    "IDs feel safe. A sequential integer in a URL looks harmless — until you change one digit. Obscuring the ID (UUIDs, Base64) is not access control.",
    "The response over-shares. Developers send the whole database row and hide fields in the UI; the API still shipped the password hash. The client is not a boundary.",
    "GraphQL blind spots. One endpoint, infinite query shapes — depth and complexity attacks look nothing like REST brute force and slip past URL-based rules.",
    "Documentation & inventory. You cannot protect endpoints you don't know exist. Shadow and zombie APIs (API9) are where real attackers live.",
  ],
  prosCons: {
    pros: [
      "API security skills transfer across every modern stack — web, mobile, microservices, and cloud all speak HTTP APIs.",
      "The OWASP API Top 10 gives a shared, industry-recognised vocabulary that maps directly to interview questions and audit checklists.",
      "Most high-impact API flaws are logic bugs you can reason about by hand — you don't need exotic tooling to find or fix them.",
    ],
    cons: [
      "Authorization logic is business-specific: no scanner truly 'understands' who should own object 102, so automated tools miss BOLA.",
      "APIs multiply faster than they are documented; the attack surface (shadow/zombie endpoints) grows quietly.",
      "GraphQL and deeply nested schemas make abuse hard to model with the request-count heuristics that work for REST.",
    ],
  },
  careerNotes:
    "API security sits at the crossroads of AppSec, penetration testing, and cloud security — a fast-growing niche as organisations expose ever more microservices. It's a natural step up from web app security for a SOC analyst, developer, or QA engineer moving into offensive/defensive AppSec. Relevant certifications include the OWASP-aligned eLearnSecurity eWPT/eWPTX, Burp Suite's Practitioner (PortSwigger) path, OffSec's OSWA/OSWE (web/exploit development), and vendor tracks like API-focused modules within GWEB (GIAC). Employers hiring here look for people who can read an OpenAPI/Swagger spec, reason about authorization boundaries, and speak the OWASP API Top 10 fluently. Realistic titles: Application Security Engineer, API Security Specialist, Penetration Tester (web/API), and Product Security Engineer.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // What an API Is and Why It's the New Attack Surface",
    summary: "What APIs actually do, why they moved to the front line of security, and the defensive mindset this course builds.",
    content: `
      <h2>The doors nobody sees</h2>
      <p>An <strong>API (Application Programming Interface)</strong> is how one piece of software talks to another. When a phone app shows your bank balance, it isn't rendering a web page — it is quietly asking a server, over HTTP, "give me account 102's balance," and the server answers with data. That conversation is the API. Every mobile app, single-page website, smart device, and microservice you touch is stitched together by thousands of these machine-to-machine calls.</p>

      <p>For most of the web's history, security effort focused on the <em>human-facing</em> website. But traffic has flipped: today the majority of internet requests are API calls, and attackers have followed. APIs are now the primary attack surface for modern applications — and they fail differently than websites do.</p>

      <h3>Why APIs are uniquely exposed</h3>
      <ul>
        <li><strong>They are built for machines, not people.</strong> There's no login page to stare at, no visible button an attacker must find — just documented (or discoverable) endpoints that accept structured requests.</li>
        <li><strong>The client is not a boundary.</strong> The pretty mobile app hides fields and greys out buttons, but the API underneath answers whatever it's asked. Anyone can bypass the app and talk to the API directly.</li>
        <li><strong>They multiply faster than they're tracked.</strong> A single product may expose hundreds of endpoints across versions. Old, forgotten ones (<em>zombie APIs</em>) and undocumented ones (<em>shadow APIs</em>) stay online, unwatched.</li>
        <li><strong>The logic is the vulnerability.</strong> Most damaging API flaws aren't memory corruption — they're mistakes in <em>who is allowed to do what</em>. That makes them invisible to many automated scanners.</li>
      </ul>

      <h3>Your defensive mission</h3>
      <p>This is an <em>authorized, educational</em> course. You are learning to think like an attacker <strong>so that you can defend</strong> — to look at an endpoint and ask the questions a designer forgot to ask. You will not attack systems you don't own or have written permission to test.</p>

      <blockquote>The single instinct this whole course trains: for every request, ask "<strong>who is asking, and are they allowed to touch this specific thing?</strong>" The vast majority of catastrophic API breaches are the answer "nobody checked."</blockquote>

      <h3>What you will build toward</h3>
      <p>By the final lessons you'll be able to take an unfamiliar API, map its endpoints, reason about its authentication and authorization boundaries, name each weakness against the OWASP API Security Top 10, and describe a layered defence — a gateway, scoped tokens, schema validation, and rate limits — that would have stopped the attack.</p>
    `,
    quizzes: [
      { id: "api-l1-q1", question: "What is an API, most simply?", options: ["A type of firewall", "A way for one piece of software to talk to another, usually over HTTP", "A password manager", "A physical network cable"], correctAnswerIndex: 1, explanation: "An API is an interface that lets software components communicate — commonly machine-to-machine calls over HTTP." },
      { id: "api-l1-q2", question: "Why have attackers increasingly targeted APIs?", options: ["APIs are never encrypted", "The majority of modern traffic is API calls, so that's where the exposed logic and data now live", "APIs are illegal to secure", "APIs only run on weekends"], correctAnswerIndex: 1, explanation: "Applications shifted to API-driven architectures, moving the bulk of traffic — and the attack surface — to APIs." },
      { id: "api-l1-q3", question: "Why is 'the client is not a boundary' an important idea?", options: ["Clients are always trusted", "The app may hide fields/buttons, but the underlying API answers direct requests regardless of the UI", "Clients encrypt everything perfectly", "It means APIs can't be attacked"], correctAnswerIndex: 1, explanation: "Hiding functionality in the UI does nothing; an attacker can call the API directly, bypassing the client entirely." },
      { id: "api-l1-q4", question: "What is a 'shadow API'?", options: ["An encrypted API", "An undocumented, untracked endpoint that is still live", "An API that only works at night", "A backup server"], correctAnswerIndex: 1, explanation: "Shadow APIs are undocumented endpoints nobody is watching — a favourite hiding place for attackers." },
      { id: "api-l1-q5", question: "Why do many automated scanners miss the worst API flaws?", options: ["Scanners are too fast", "The flaws are business-logic/authorization mistakes a tool can't understand (who should own object 102?)", "APIs block all scanners", "Scanners only read images"], correctAnswerIndex: 1, explanation: "Authorization is business-specific; a scanner cannot know who is supposed to own a given resource." },
      { id: "api-l1-q6", question: "What is a 'zombie API'?", options: ["An API that infects users", "An old, forgotten endpoint left online and unmaintained", "A brand-new endpoint", "An API written in assembly"], correctAnswerIndex: 1, explanation: "Zombie APIs are outdated, forgotten endpoints still reachable — often unpatched and unmonitored." },
      { id: "api-l1-q7", question: "What is the core defensive question this course teaches?", options: ["How fast is the server?", "Who is asking, and are they allowed to touch this specific thing?", "What colour is the response?", "How big is the log file?"], correctAnswerIndex: 1, explanation: "Most API breaches trace back to nobody verifying whether the requester was authorized for that specific resource." },
      { id: "api-l1-q8", question: "What framing does this course operate under?", options: ["Attack anyone to learn faster", "Authorized, educational, defensive testing only", "Ignore permission entirely", "Only theory, never applied"], correctAnswerIndex: 1, explanation: "You learn attacker reasoning to defend, and only test systems you own or are explicitly authorized to test." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Foundations: REST, HTTP, and the Anatomy of a Request",
    summary: "How REST APIs work over HTTP — methods, paths, headers, status codes, and JSON bodies — read field by field.",
    content: `
      <h2>Learn to read the wire</h2>
      <p>Before you can secure an API you must fluently read what crosses the wire. The dominant style is <strong>REST (Representational State Transfer)</strong>: resources live at URLs, and you act on them with HTTP <strong>methods</strong>. A resource is a noun (an account, a user, an order); the method is the verb.</p>

      <h3>The HTTP methods</h3>
      <table>
        <thead><tr><th>Method</th><th>Intent</th><th>Example</th></tr></thead>
        <tbody>
          <tr><td><strong>GET</strong></td><td>Read a resource (should not change anything)</td><td><code>GET /api/v1/accounts/102</code></td></tr>
          <tr><td><strong>POST</strong></td><td>Create a new resource</td><td><code>POST /api/v1/accounts</code></td></tr>
          <tr><td><strong>PUT / PATCH</strong></td><td>Replace / partially update a resource</td><td><code>PATCH /api/v1/accounts/102</code></td></tr>
          <tr><td><strong>DELETE</strong></td><td>Remove a resource</td><td><code>DELETE /api/v1/accounts/102</code></td></tr>
        </tbody>
      </table>

      <h3>A request, dissected</h3>
      <p>Here is a complete request. Every line is a lever an attacker (and a defender) thinks about:</p>
      <pre><code>GET /api/v1/accounts/102 HTTP/1.1
Host: bank.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
Accept: application/json
User-Agent: MobileApp/3.2</code></pre>
      <ul>
        <li><strong>Request line</strong> — method + path + protocol. The <code>102</code> is an <em>object identifier</em>; hold that thought, it becomes the star of Lesson 4.</li>
        <li><strong>Host</strong> — which server.</li>
        <li><strong>Authorization</strong> — <em>who</em> is asking. Here a bearer token proves identity. Note: identity (authentication) is not the same as permission (authorization).</li>
        <li><strong>Accept</strong> — what format the client wants back.</li>
      </ul>

      <h3>The response</h3>
      <pre><code>HTTP/1.1 200 OK
Content-Type: application/json

{
  "account_id": 102,
  "owner": "finance_chief",
  "balance": "$4,820,000"
}</code></pre>

      <h3>Status codes: the server's verdict</h3>
      <table>
        <thead><tr><th>Range</th><th>Meaning</th><th>Security-relevant example</th></tr></thead>
        <tbody>
          <tr><td><strong>2xx</strong></td><td>Success</td><td><code>200 OK</code> — request worked (sometimes when it shouldn't have!)</td></tr>
          <tr><td><strong>3xx</strong></td><td>Redirect</td><td><code>302 Found</code></td></tr>
          <tr><td><strong>4xx</strong></td><td>Client error</td><td><code>401 Unauthorized</code> (not authenticated) vs <code>403 Forbidden</code> (authenticated but not allowed)</td></tr>
          <tr><td><strong>5xx</strong></td><td>Server error</td><td><code>500</code> — may leak stack traces (Lesson 8)</td></tr>
        </tbody>
      </table>
      <p>Learn the <strong>401 vs 403</strong> distinction cold: <code>401</code> means "I don't know who you are," <code>403</code> means "I know who you are and you may not." A resource that returns <code>200</code> when it should have returned <code>403</code> is the fingerprint of a broken-authorization bug.</p>

      <blockquote>REST is <strong>stateless</strong>: each request must carry everything the server needs to identify and authorize it — usually a token in the <code>Authorization</code> header. The server does not "remember" you between calls. That statelessness is why every single request must be checked, not just the login.</blockquote>
    `,
    quizzes: [
      { id: "api-l2-q1", question: "In REST, what does an HTTP method represent?", options: ["The colour of the resource", "The verb/action performed on a resource (read, create, update, delete)", "The server's location", "The encryption key"], correctAnswerIndex: 1, explanation: "Methods (GET/POST/PUT/PATCH/DELETE) are the verbs acting on resources identified by URLs." },
      { id: "api-l2-q2", question: "Which method is intended only to READ a resource without changing it?", options: ["POST", "DELETE", "GET", "PATCH"], correctAnswerIndex: 2, explanation: "GET is meant to be a safe, read-only retrieval that does not modify server state." },
      { id: "api-l2-q3", question: "What does the Authorization header typically carry?", options: ["The server's hostname", "Credentials/token proving who is making the request", "The response body", "The status code"], correctAnswerIndex: 1, explanation: "The Authorization header carries the caller's identity proof, e.g. a bearer token." },
      { id: "api-l2-q4", question: "What is the difference between 401 and 403?", options: ["They are identical", "401 = not authenticated (who are you?); 403 = authenticated but not permitted", "401 = success; 403 = redirect", "403 means the server crashed"], correctAnswerIndex: 1, explanation: "401 Unauthorized means identity is unknown; 403 Forbidden means identity is known but access is denied." },
      { id: "api-l2-q5", question: "In GET /api/v1/accounts/102, what is 102?", options: ["The port number", "An object identifier for a specific resource", "The status code", "The token"], correctAnswerIndex: 1, explanation: "102 identifies the specific account resource being requested — a value attackers love to change." },
      { id: "api-l2-q6", question: "Why does REST being 'stateless' matter for security?", options: ["It means logs are optional", "Each request must carry its own auth, so every request must be checked — not just the login", "It means no encryption is needed", "It disables tokens"], correctAnswerIndex: 1, explanation: "Statelessness means the server checks each request independently; skipping per-request checks is a core flaw." },
      { id: "api-l2-q7", question: "A request to another user's record returns 200 OK with their data. What does that suggest?", options: ["Correct behaviour", "A likely broken-authorization flaw — it should have been 403", "A network error", "A DNS problem"], correctAnswerIndex: 1, explanation: "Returning 200 with someone else's data instead of 403 is the classic signature of a broken authorization check." },
      { id: "api-l2-q8", question: "Which status code range indicates a server-side error that may leak details?", options: ["2xx", "3xx", "4xx", "5xx"], correctAnswerIndex: 3, explanation: "5xx errors (e.g., 500) can expose stack traces or internal details if error handling is misconfigured." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // GraphQL and the OWASP API Security Top 10",
    summary: "How GraphQL differs from REST, and a guided tour of the ten OWASP API Security risks that organise the rest of the course.",
    content: `
      <h2>Not all APIs are REST</h2>
      <p>REST exposes many endpoints, each returning a fixed shape. <strong>GraphQL</strong> flips this: it exposes <em>one</em> endpoint (usually <code>/graphql</code>) and lets the client ask for exactly the fields it wants in a single query. Powerful for developers — and a distinct security challenge, because one endpoint can express infinitely many query shapes.</p>

      <pre><code>POST /graphql HTTP/1.1
Content-Type: application/json

{ "query": "{ account(id: 102) { owner balance transactions { amount } } }" }</code></pre>

      <table>
        <thead><tr><th></th><th>REST</th><th>GraphQL</th></tr></thead>
        <tbody>
          <tr><td>Endpoints</td><td>Many (one per resource)</td><td>Usually one (<code>/graphql</code>)</td></tr>
          <tr><td>Response shape</td><td>Fixed by the server</td><td>Chosen by the client</td></tr>
          <tr><td>Over/under-fetching</td><td>Common</td><td>Avoided by design</td></tr>
          <tr><td>Security watch-outs</td><td>Per-endpoint auth, IDs in URLs</td><td>Query depth/complexity abuse, introspection exposure, batching attacks</td></tr>
        </tbody>
      </table>
      <p>Two GraphQL-specific hazards to file away: <strong>introspection</strong> (the schema can be queried to reveal every type and field — great for developers, a map for attackers if left on in production) and <strong>deeply nested queries</strong> that a client can craft to exhaust the server (a resource-consumption attack you'll meet in Lesson 6).</p>

      <h2>The OWASP API Security Top 10 (2023)</h2>
      <p>The <strong>OWASP API Security Top 10</strong> is the industry's canonical list of the most critical API risks. It is the backbone of this course — memorise the shape of it:</p>
      <table>
        <thead><tr><th>ID</th><th>Risk</th><th>One-line symptom</th></tr></thead>
        <tbody>
          <tr><td><strong>API1</strong></td><td>Broken Object Level Authorization (BOLA)</td><td>Access another user's object by changing an ID.</td></tr>
          <tr><td><strong>API2</strong></td><td>Broken Authentication</td><td>Weak/forgeable login, tokens, or password flows.</td></tr>
          <tr><td><strong>API3</strong></td><td>Broken Object Property Level Authorization</td><td>Excessive data exposure + mass assignment (properties you shouldn't read/write).</td></tr>
          <tr><td><strong>API4</strong></td><td>Unrestricted Resource Consumption</td><td>No rate/size limits → DoS and cost blow-ups.</td></tr>
          <tr><td><strong>API5</strong></td><td>Broken Function Level Authorization (BFLA)</td><td>Call an admin-only function as a normal user.</td></tr>
          <tr><td><strong>API6</strong></td><td>Unrestricted Access to Sensitive Business Flows</td><td>Automating a flow (e.g., bulk purchase) beyond intended use.</td></tr>
          <tr><td><strong>API7</strong></td><td>Server-Side Request Forgery (SSRF)</td><td>API fetches an attacker-supplied URL, reaching internal systems.</td></tr>
          <tr><td><strong>API8</strong></td><td>Security Misconfiguration</td><td>Defaults, verbose errors, missing headers, open CORS.</td></tr>
          <tr><td><strong>API9</strong></td><td>Improper Inventory Management</td><td>Shadow/zombie APIs, undocumented versions.</td></tr>
          <tr><td><strong>API10</strong></td><td>Unsafe Consumption of APIs</td><td>Blindly trusting data from third-party APIs.</td></tr>
        </tbody>
      </table>

      <blockquote>Notice the pattern: <strong>the top of the list is dominated by authorization</strong> (API1, API3, API5). Injection — the classic web villain — isn't even in the top five here. That's the defining lesson of API security: the flaws are usually about <em>permissions and logic</em>, not malformed input.</blockquote>

      <h3>How this course maps to the list</h3>
      <p>The remaining lessons take these in turn: BOLA (L4), Broken Authentication (L5), data exposure & mass assignment (L6 property-level), resource consumption & rate limiting (L7), misconfiguration and SSRF (L8), tokens/keys (L9 auth machinery), and injection plus the defensive gateway/WAF design that ties it together (L10 and throughout).</p>
    `,
    quizzes: [
      { id: "api-l3-q1", question: "How does GraphQL differ structurally from REST?", options: ["It uses no HTTP", "It exposes one endpoint and lets clients request exactly the fields they want", "It has no authentication", "It only returns images"], correctAnswerIndex: 1, explanation: "GraphQL typically exposes a single endpoint where the client specifies the exact shape of the response." },
      { id: "api-l3-q2", question: "Why is GraphQL introspection a security consideration in production?", options: ["It speeds up queries", "It can reveal the entire schema (types and fields), handing attackers a map", "It encrypts the database", "It blocks all queries"], correctAnswerIndex: 1, explanation: "Introspection exposes the full schema; leaving it enabled in production aids reconnaissance." },
      { id: "api-l3-q3", question: "What does API1 (BOLA) describe?", options: ["Weak passwords", "Accessing another user's object by manipulating an object identifier", "A server crash", "Missing TLS"], correctAnswerIndex: 1, explanation: "BOLA is Broken Object Level Authorization — reaching objects you don't own by changing IDs." },
      { id: "api-l3-q4", question: "Which risks dominate the TOP of the OWASP API Top 10?", options: ["Injection flaws", "Authorization flaws (API1, API3, API5)", "Encryption flaws", "Logging flaws"], correctAnswerIndex: 1, explanation: "The list is led by authorization failures — the defining characteristic of API security." },
      { id: "api-l3-q5", question: "What is Broken Function Level Authorization (API5, BFLA)?", options: ["Reading another user's record", "Calling an admin-only function as a normal user", "A slow database query", "A missing security header"], correctAnswerIndex: 1, explanation: "BFLA is about functions/actions: a lower-privilege user invoking a privileged operation." },
      { id: "api-l3-q6", question: "What does API4, Unrestricted Resource Consumption, lead to?", options: ["Better performance", "Denial of service and runaway costs from missing rate/size limits", "Stronger authentication", "Automatic encryption"], correctAnswerIndex: 1, explanation: "Without limits on requests, payload sizes, or query complexity, an API can be exhausted or made expensive." },
      { id: "api-l3-q7", question: "What is API7, SSRF, in an API context?", options: ["A password-cracking attack", "The API fetches an attacker-supplied URL, reaching internal systems", "A logging failure", "A CSS bug"], correctAnswerIndex: 1, explanation: "Server-Side Request Forgery tricks the server into making requests to attacker-chosen destinations, often internal." },
      { id: "api-l3-q8", question: "What is a GraphQL-specific resource attack?", options: ["Changing a URL ID", "Crafting deeply nested/complex queries that exhaust the server", "Deleting a cookie", "Renaming a header"], correctAnswerIndex: 1, explanation: "Because clients control query shape, deeply nested or complex queries can consume disproportionate resources." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Broken Object Level Authorization (BOLA / IDOR)",
    summary: "The #1 API risk explained end to end — why changing an ID works, how to detect it, and how to fix it correctly.",
    content: `
      <h2>The one-digit breach</h2>
      <p><strong>Broken Object Level Authorization (BOLA)</strong> — historically called <strong>IDOR (Insecure Direct Object Reference)</strong> — is API risk #1 for a reason: it is both the most common and among the most damaging. The idea is devastatingly simple. An endpoint takes an object identifier and returns that object <em>without checking whether the caller is allowed to see it</em>.</p>

      <p>Return to our hotel analogy: your key card is valid, so the lock opens — but the lock only checks that the card is <em>valid</em>, never that it belongs to <em>this room</em>. Change the room number and you're in someone else's room. In APIs, the "room number" is the ID in the request.</p>

      <h3>Watch it happen</h3>
      <p>A low-privilege user, correctly authenticated, requests their own account:</p>
      <pre><code>GET /api/v1/accounts/101 HTTP/1.1
Authorization: Bearer recruit_token

HTTP/1.1 200 OK
{ "account_id": 101, "owner": "recruit", "balance": "$40" }</code></pre>
      <p>Now they change one digit — the token is unchanged, they are still "recruit":</p>
      <pre><code>GET /api/v1/accounts/102 HTTP/1.1
Authorization: Bearer recruit_token

HTTP/1.1 200 OK
{ "account_id": 102, "owner": "finance_chief", "balance": "$4,820,000" }</code></pre>
      <p>The server <em>authenticated</em> the user (the token is valid) but never <em>authorized</em> the request (does recruit own account 102?). It returned <code>200</code> where it owed a <code>403</code>. That gap is the entire vulnerability.</p>

      <h3>Authentication vs authorization — burn this in</h3>
      <table>
        <thead><tr><th></th><th>Authentication</th><th>Authorization</th></tr></thead>
        <tbody>
          <tr><td>Question</td><td>Who are you?</td><td>Are you allowed to do THIS?</td></tr>
          <tr><td>BOLA failure</td><td>Passed (token valid)</td><td>Failed (ownership never checked)</td></tr>
          <tr><td>Failure code</td><td>401</td><td>403</td></tr>
        </tbody>
      </table>
      <p>BOLA is <strong>always</strong> an authorization failure on an <em>authenticated</em> request. This is why "just require login" does nothing to fix it.</p>

      <h3>Why obscuring IDs doesn't help</h3>
      <p>A tempting non-fix is to make IDs unguessable — UUIDs, or Base64-encoding <code>102</code>. This is <strong>security through obscurity</strong>. It raises the bar for guessing but fixes nothing: the moment an attacker <em>obtains</em> a valid other-user ID (leaked in a response, a referral link, a shared object), the endpoint hands the data over. Unpredictable IDs are a mild hardening layer, never an access control.</p>

      <h3>The correct fix</h3>
      <p>On <em>every</em> request that references an object, verify the authenticated principal is authorized for <em>that specific object</em>, server-side. In pseudocode:</p>
      <pre><code>account = db.get(requested_id)
if account.owner_id != session.user_id and not session.is_admin:
    return 403 Forbidden
return account</code></pre>
      <p>The check must live on the server, run on every request, and compare the session's identity against the object's owner. Do this and changing the digit yields a clean <code>403</code>.</p>

      <blockquote>MITRE mapping: exploiting a public API this way is <strong>T1190 Exploit Public-Facing Application</strong>; using the access it grants is <strong>T1078 Valid Accounts</strong>. In OWASP terms this is <strong>API1:2023</strong>.</blockquote>
    `,
    quizzes: [
      { id: "api-l4-q1", question: "What is BOLA?", options: ["A password attack", "Accessing another user's object because the server doesn't verify object ownership", "A denial-of-service attack", "A TLS misconfiguration"], correctAnswerIndex: 1, explanation: "BOLA (a.k.a. IDOR) is failing to check that the authenticated caller is authorized for the specific requested object." },
      { id: "api-l4-q2", question: "In a BOLA attack, which check passed and which failed?", options: ["Authentication failed, authorization passed", "Authentication passed, authorization failed", "Both failed", "Both passed"], correctAnswerIndex: 1, explanation: "The token was valid (authenticated) but the server never verified ownership (authorization failed)." },
      { id: "api-l4-q3", question: "What status code SHOULD the server have returned for the unauthorized object request?", options: ["200 OK", "403 Forbidden", "301 Moved", "500 Error"], correctAnswerIndex: 1, explanation: "An authenticated user requesting an object they don't own should get 403 Forbidden." },
      { id: "api-l4-q4", question: "Why is encoding IDs as Base64 or using UUIDs NOT a real fix for BOLA?", options: ["It slows the server", "It's security through obscurity — once an attacker obtains a valid ID, access is still granted", "It breaks the API entirely", "It only works for GET requests"], correctAnswerIndex: 1, explanation: "Obscuring IDs doesn't add an authorization check; a leaked or discovered ID still returns the data." },
      { id: "api-l4-q5", question: "Where must the BOLA authorization check run?", options: ["In the client/browser only", "Server-side, on every request, comparing session identity to object ownership", "In the DNS server", "In the firewall only"], correctAnswerIndex: 1, explanation: "The ownership check must be enforced server-side on every object-referencing request." },
      { id: "api-l4-q6", question: "What is the older name commonly used for BOLA?", options: ["XSS", "IDOR (Insecure Direct Object Reference)", "CSRF", "SSRF"], correctAnswerIndex: 1, explanation: "BOLA was long known as IDOR — Insecure Direct Object Reference." },
      { id: "api-l4-q7", question: "Which MITRE technique best fits exploiting a public API endpoint like this?", options: ["T1190 Exploit Public-Facing Application", "T1486 Data Encrypted for Impact", "T1566 Phishing", "T1046 Network Service Discovery"], correctAnswerIndex: 0, explanation: "Abusing a flaw in a public-facing API maps to T1190 Exploit Public-Facing Application." },
      { id: "api-l4-q8", question: "Why does 'just require users to log in' fail to fix BOLA?", options: ["Login is impossible on APIs", "BOLA occurs AFTER a valid login — it's an authorization gap, not an authentication gap", "Login disables the database", "It actually does fix it"], correctAnswerIndex: 1, explanation: "The attacker is already authenticated; the missing control is per-object authorization, which login doesn't provide." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Broken Authentication and Function-Level Authorization",
    summary: "How login and token mechanisms fail (API2), and how BFLA (API5) lets normal users invoke admin functions.",
    content: `
      <h2>Two ways the front door fails</h2>
      <p>Lesson 4 was about accessing the wrong <em>object</em>. This lesson covers two neighbouring failures: getting in as the wrong <em>person</em> (<strong>Broken Authentication, API2</strong>) and, once in, calling the wrong <em>function</em> (<strong>Broken Function Level Authorization, API5</strong>).</p>

      <h3>Broken Authentication (API2)</h3>
      <p>Authentication is proving who you are. It breaks in many familiar ways:</p>
      <ul>
        <li><strong>Weak credential policies</strong> — no lockout or rate limiting on login, so credential stuffing and brute force (MITRE <strong>T1110</strong>) succeed.</li>
        <li><strong>Guessable or leaked API keys</strong> — keys hard-coded in mobile apps or committed to public repositories.</li>
        <li><strong>Flawed token handling</strong> — tokens that never expire, are transmitted in URLs (and thus logged), or can be forged (Lesson 9 dives into JWT pitfalls like the <code>alg: none</code> trick).</li>
        <li><strong>Broken password reset / OTP flows</strong> — reset tokens that are predictable or not invalidated after use.</li>
        <li><strong>Unprotected authentication endpoints</strong> — <code>/login</code> and <code>/token</code> with no throttling.</li>
      </ul>
      <p>The core defence: strong, standard authentication (short-lived tokens, MFA, lockout/throttling on auth endpoints) and treating credentials and keys as secrets that never live in client code or repos.</p>

      <h3>Broken Function Level Authorization (API5 / BFLA)</h3>
      <p>BFLA is BOLA's sibling. Where BOLA is "can I read this <em>object</em>?", BFLA is "can I invoke this <em>function</em>?". A normal user discovers — or guesses — an administrative endpoint and calls it successfully because the server checks that they're logged in, but not that they hold the required <em>role</em>.</p>
      <pre><code># A regular user, authenticated, calls an admin-only endpoint:
DELETE /api/v1/admin/users/55 HTTP/1.1
Authorization: Bearer normal_user_token

HTTP/1.1 200 OK        &lt;-- should have been 403 Forbidden</code></pre>
      <p>Attackers find these by noticing patterns: if <code>GET /api/v1/users/me</code> exists, maybe <code>GET /api/v1/admin/users</code> does too. Changing the HTTP method also matters — a <code>GET</code> might be allowed while the <code>DELETE</code> on the same path should not be.</p>

      <h3>Object vs Function — keep them straight</h3>
      <table>
        <thead><tr><th></th><th>BOLA (API1)</th><th>BFLA (API5)</th></tr></thead>
        <tbody>
          <tr><td>Question</td><td>Can I access THIS object/record?</td><td>Can I call THIS function/action?</td></tr>
          <tr><td>Typical exploit</td><td>Change an ID in the path</td><td>Call an admin endpoint / method as a low-priv user</td></tr>
          <tr><td>Missing check</td><td>Object ownership</td><td>Role / privilege for the operation</td></tr>
        </tbody>
      </table>

      <h3>The unifying fix: enforce roles server-side</h3>
      <p>Every privileged function must verify the caller's <strong>role/permission</strong> before acting — never rely on the UI hiding the button. Adopt a default-deny model: endpoints are forbidden unless the caller's role explicitly grants access. This is the <strong>principle of least privilege</strong> applied to functions.</p>

      <blockquote>Rule of thumb: authentication answers "who," authorization answers "what may they do." BOLA and BFLA are both authorization failures — one at the object level, one at the function level. Broken Authentication is the separate failure of getting "who" wrong in the first place.</blockquote>
    `,
    quizzes: [
      { id: "api-l5-q1", question: "What does Broken Authentication (API2) concern?", options: ["Accessing another user's record", "Flaws in proving who a user is — weak logins, forgeable/leaked tokens and keys", "Slow database queries", "Missing CSS"], correctAnswerIndex: 1, explanation: "API2 covers failures in the mechanisms that establish identity: credentials, tokens, keys, and reset flows." },
      { id: "api-l5-q2", question: "What is BFLA (API5)?", options: ["Reading another user's object", "A lower-privilege user invoking a function/action that requires a higher role", "A network timeout", "An encryption error"], correctAnswerIndex: 1, explanation: "Broken Function Level Authorization is calling privileged functions without holding the required role." },
      { id: "api-l5-q3", question: "How do BOLA and BFLA differ?", options: ["They are the same", "BOLA is about accessing objects/records; BFLA is about invoking functions/actions", "BOLA is authentication; BFLA is encryption", "BFLA only affects GraphQL"], correctAnswerIndex: 1, explanation: "BOLA = wrong object; BFLA = wrong function. Both are authorization failures at different levels." },
      { id: "api-l5-q4", question: "Why is hard-coding an API key in a mobile app dangerous?", options: ["It slows the app", "The key can be extracted and reused by anyone who decompiles the app", "It improves security", "Keys can't be hard-coded"], correctAnswerIndex: 1, explanation: "Client apps can be decompiled; embedded secrets are effectively public and enable impersonation." },
      { id: "api-l5-q5", question: "A normal user's DELETE to /api/v1/admin/users/55 returns 200 OK. What is this?", options: ["Correct behaviour", "BFLA — the server didn't check the caller's role for a privileged function", "A caching bug", "A DNS error"], correctAnswerIndex: 1, explanation: "The privileged action succeeded without a role check — Broken Function Level Authorization." },
      { id: "api-l5-q6", question: "Which model best prevents BFLA?", options: ["Default-allow, hide buttons in the UI", "Default-deny: forbid every function unless the caller's role explicitly grants it", "Trust the client", "Encode endpoint names"], correctAnswerIndex: 1, explanation: "A server-side default-deny, role-checked model applies least privilege to functions." },
      { id: "api-l5-q7", question: "Why is throttling/lockout on the /login endpoint important?", options: ["It makes login prettier", "It slows brute force and credential stuffing (MITRE T1110) against authentication", "It disables tokens", "It encrypts the URL"], correctAnswerIndex: 1, explanation: "Rate limiting authentication endpoints defends against automated credential-guessing attacks." },
      { id: "api-l5-q8", question: "Why should the fix for BFLA never rely on the UI hiding a button?", options: ["UIs are always slow", "Attackers call the API directly, bypassing the UI entirely", "Buttons can't be hidden", "The UI is the server"], correctAnswerIndex: 1, explanation: "Hiding functionality client-side does nothing; the API must enforce role checks server-side." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Excessive Data Exposure & Mass Assignment (Property-Level)",
    summary: "API3 in two directions — servers over-sharing fields on the way out, and blindly binding fields on the way in.",
    content: `
      <h2>Two sides of one coin</h2>
      <p><strong>Broken Object Property Level Authorization (API3:2023)</strong> merges two classic flaws that are mirror images of each other. Both stem from the server trusting the shape of data instead of controlling it property by property:</p>
      <ul>
        <li><strong>Excessive Data Exposure</strong> — the server returns MORE fields than the client should see (a read problem).</li>
        <li><strong>Mass Assignment</strong> — the server accepts MORE fields than the client should set (a write problem).</li>
      </ul>

      <h3>Excessive Data Exposure (the over-share)</h3>
      <p>A lazy but common pattern: the endpoint fetches the whole database row and serialises all of it, trusting the UI to display only the safe parts. But the API is the boundary, not the UI. Ask for a user profile and you may get:</p>
      <pre><code>GET /api/v1/users/101 HTTP/1.1

HTTP/1.1 200 OK
{
  "id": 101,
  "username": "recruit",
  "email": "recruit@corp.com",
  "password_hash": "$2b$12$Kx...",     &lt;-- should NEVER leave the server
  "is_admin": false,
  "internal_risk_score": 88            &lt;-- internal-only field leaked
}</code></pre>
      <p>The fix is to <strong>explicitly define the response schema</strong> — an allowlist of exactly which properties may be returned (a DTO / serializer). Never blindly return the raw record.</p>

      <h3>Mass Assignment (the over-accept)</h3>
      <p>The reverse: a client sends a JSON body to update a resource, and the server binds every field it finds straight onto the object. The user is <em>supposed</em> to update their display name — but they slip in a field they should never control:</p>
      <pre><code>PATCH /api/v1/users/101 HTTP/1.1
Authorization: Bearer recruit_token

{
  "display_name": "Recruit",
  "is_admin": true                    &lt;-- privilege escalation via mass assignment
}</code></pre>
      <p>If the server auto-binds <code>is_admin</code>, the user just promoted themselves — a privilege escalation with a single extra field. The fix is the same principle from the other direction: <strong>allowlist the writable properties</strong>. Only bind fields the client is permitted to set; ignore or reject everything else. Never blindly deserialise a request body onto a model.</p>

      <h3>The shared root cause and cure</h3>
      <table>
        <thead><tr><th></th><th>Excessive Data Exposure</th><th>Mass Assignment</th></tr></thead>
        <tbody>
          <tr><td>Direction</td><td>Response (read)</td><td>Request (write)</td></tr>
          <tr><td>Mistake</td><td>Return the whole object</td><td>Accept the whole object</td></tr>
          <tr><td>Impact</td><td>Sensitive-data leak</td><td>Privilege escalation / data tampering</td></tr>
          <tr><td>Fix</td><td>Allowlist returned fields</td><td>Allowlist writable fields</td></tr>
        </tbody>
      </table>

      <blockquote>The unifying principle is <strong>explicit property-level control in both directions</strong>. Decide field by field what may be read and what may be written — never let the database schema define your API's contract by default. "Filter on the client" is not a control; the client already received the data.</blockquote>
    `,
    quizzes: [
      { id: "api-l6-q1", question: "What is Excessive Data Exposure?", options: ["Accepting too many fields in a request", "Returning more fields in the response than the client should see", "A brute-force attack", "A rate-limit bypass"], correctAnswerIndex: 1, explanation: "It's the over-sharing of properties in responses, trusting the client to hide the sensitive ones." },
      { id: "api-l6-q2", question: "What is Mass Assignment?", options: ["Returning the whole database row", "Binding client-supplied fields directly onto an object, including ones the user shouldn't set", "Sending too many requests", "Encrypting all fields"], correctAnswerIndex: 1, explanation: "Mass assignment auto-binds request fields to a model, letting attackers set properties like is_admin." },
      { id: "api-l6-q3", question: "A profile response includes password_hash and internal_risk_score. Which flaw is this?", options: ["Mass assignment", "Excessive Data Exposure", "SSRF", "Rate limiting"], correctAnswerIndex: 1, explanation: "Sensitive/internal fields leaving the server in a response is Excessive Data Exposure." },
      { id: "api-l6-q4", question: "A PATCH body adds \"is_admin\": true and the user becomes admin. Which flaw?", options: ["Excessive Data Exposure", "Mass Assignment (privilege escalation)", "Broken TLS", "GraphQL introspection"], correctAnswerIndex: 1, explanation: "The server bound a field the client should not control — mass assignment leading to privilege escalation." },
      { id: "api-l6-q5", question: "What is the correct fix for Excessive Data Exposure?", options: ["Hide fields in the UI", "Explicitly define a response schema / allowlist of returnable properties", "Encode the response in Base64", "Add a firewall rule"], correctAnswerIndex: 1, explanation: "Use a DTO/serializer that returns only an explicit allowlist of safe fields." },
      { id: "api-l6-q6", question: "What is the correct fix for Mass Assignment?", options: ["Trust the client to send only valid fields", "Allowlist the writable properties and ignore/reject the rest", "Return all fields", "Disable HTTPS"], correctAnswerIndex: 1, explanation: "Only bind fields the client is permitted to set; never blindly deserialise the whole body onto the model." },
      { id: "api-l6-q7", question: "Why is 'filter the data on the client' not a valid control for over-exposure?", options: ["Clients are too slow", "The client already received the sensitive data — the leak already happened", "Clients can't filter", "It doubles bandwidth"], correctAnswerIndex: 1, explanation: "Once data leaves the server, hiding it client-side is meaningless; it's already in the attacker's hands." },
      { id: "api-l6-q8", question: "What single principle addresses both halves of API3?", options: ["Encrypt everything twice", "Explicit property-level control in both directions — allowlist reads and writes", "Change all IDs to UUIDs", "Block all POST requests"], correctAnswerIndex: 1, explanation: "Decide field by field what may be read and written; don't let the DB schema define the API contract." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Unrestricted Resource Consumption & Rate Limiting",
    summary: "API4 — how missing limits enable DoS, brute force, and cost explosions, and how rate limiting and quotas defend the API.",
    content: `
      <h2>When 'no limit' becomes the vulnerability</h2>
      <p>Every request costs something: CPU, memory, database time, bandwidth, and in the cloud, literal money. <strong>Unrestricted Resource Consumption (API4:2023)</strong> is the failure to bound those costs. Without limits, an attacker (or a buggy client) can exhaust the service — a <strong>Denial of Service (DoS)</strong> — or run up enormous bills.</p>

      <h3>What goes unbounded</h3>
      <ul>
        <li><strong>Request rate</strong> — no cap on requests per second/minute per client. Enables brute force, scraping, and floods.</li>
        <li><strong>Payload size</strong> — accepting arbitrarily large request bodies or file uploads.</li>
        <li><strong>Page size</strong> — <code>?limit=1000000</code> returning a million records in one call.</li>
        <li><strong>Query complexity</strong> — especially in GraphQL, deeply nested queries that fan out exponentially.</li>
        <li><strong>Third-party costs</strong> — each call triggers an expensive downstream operation (SMS, AI inference, image processing) with no quota.</li>
      </ul>

      <h3>Rate limiting: the primary control</h3>
      <p><strong>Rate limiting</strong> caps how many requests a client may make in a time window — the same sliding-window idea used in intrusion detection, applied preventively. Two common algorithms:</p>
      <table>
        <thead><tr><th>Algorithm</th><th>How it works</th><th>Character</th></tr></thead>
        <tbody>
          <tr><td><strong>Token bucket</strong></td><td>A bucket refills tokens at a fixed rate; each request spends one. Empty bucket → reject.</td><td>Allows short bursts, smooths average rate.</td></tr>
          <tr><td><strong>Fixed / sliding window</strong></td><td>Count requests per window (e.g., 100/min); over the count → reject.</td><td>Simple; sliding variant avoids edge bursts.</td></tr>
        </tbody>
      </table>
      <p>When a client exceeds the limit, the correct response is <strong><code>429 Too Many Requests</code></strong>, ideally with a <code>Retry-After</code> header telling the client when to try again:</p>
      <pre><code>HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json

{ "error": "rate_limit_exceeded", "limit": 100, "window": "60s" }</code></pre>

      <h3>Beyond rate limits</h3>
      <ul>
        <li><strong>Quotas</strong> — longer-term caps (per day/month), often per API key or plan tier.</li>
        <li><strong>Payload &amp; page-size limits</strong> — reject bodies over N bytes; enforce a maximum <code>limit</code> and paginate.</li>
        <li><strong>Timeouts &amp; complexity budgets</strong> — cap execution time; for GraphQL, limit query depth and assign a complexity cost.</li>
        <li><strong>Spend controls</strong> — alerting and hard caps on cost-incurring downstream calls.</li>
      </ul>

      <blockquote>Rate limiting is a rare control that defends against MANY risks at once: it blunts brute force (API2), slows resource exhaustion (API4), and throttles automated abuse of business flows (API6). It is one of the highest-leverage defensive settings on any API — yet it's routinely left off. Note it is a <em>mitigation</em>, not a cure: a distributed attack from many IPs/keys still needs layered defence.</blockquote>
    `,
    quizzes: [
      { id: "api-l7-q1", question: "What does Unrestricted Resource Consumption (API4) enable?", options: ["Stronger encryption", "Denial of service and runaway costs by exhausting unbounded resources", "Better authentication", "Automatic backups"], correctAnswerIndex: 1, explanation: "Without limits on rate, size, or complexity, attackers can exhaust the service or drive up costs." },
      { id: "api-l7-q2", question: "Which status code signals a client has exceeded the rate limit?", options: ["200 OK", "403 Forbidden", "429 Too Many Requests", "500 Internal Server Error"], correctAnswerIndex: 2, explanation: "429 Too Many Requests is the standard response for rate-limit violations." },
      { id: "api-l7-q3", question: "What does the token bucket algorithm allow that a strict fixed cap does not?", options: ["Unlimited requests", "Short bursts while smoothing the average rate", "No requests at all", "Only GET requests"], correctAnswerIndex: 1, explanation: "The bucket accumulates tokens, permitting brief bursts up to the bucket size while limiting the sustained rate." },
      { id: "api-l7-q4", question: "Why is an unbounded ?limit= parameter dangerous?", options: ["It's always cached", "A client can request a huge number of records in one call, exhausting memory/DB", "It disables auth", "It changes the URL"], correctAnswerIndex: 1, explanation: "Unbounded page sizes let a single request pull enormous datasets, a resource-exhaustion vector." },
      { id: "api-l7-q5", question: "Which header tells a rate-limited client when to retry?", options: ["Content-Type", "Retry-After", "Authorization", "User-Agent"], correctAnswerIndex: 1, explanation: "Retry-After indicates how long the client should wait before making another request." },
      { id: "api-l7-q6", question: "Why are GraphQL queries a special resource-consumption concern?", options: ["They can't be limited", "Deeply nested queries can fan out and consume disproportionate resources", "They never touch the database", "They are always cached"], correctAnswerIndex: 1, explanation: "Because clients control query shape, complex nested queries can be far more expensive than they appear." },
      { id: "api-l7-q7", question: "Rate limiting helps defend against which of these simultaneously?", options: ["Only DoS", "Brute force, resource exhaustion, and automated business-flow abuse", "Only phishing", "Only SQL injection"], correctAnswerIndex: 1, explanation: "It's a high-leverage control blunting API2 brute force, API4 exhaustion, and API6 flow abuse." },
      { id: "api-l7-q8", question: "What is a quota, as distinct from a rate limit?", options: ["A per-second cap", "A longer-term cap (e.g., per day/month), often tied to an API key or plan", "A type of token", "A GraphQL feature"], correctAnswerIndex: 1, explanation: "Quotas bound usage over longer periods, typically per key or subscription tier." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Security Misconfiguration, SSRF, and Inventory",
    summary: "API8 misconfigurations, API7 server-side request forgery, and API9 inventory gaps — the environment around the code.",
    content: `
      <h2>The vulnerabilities that aren't in your code</h2>
      <p>Not every flaw is a logic bug in an endpoint. Some live in configuration, in how the API talks to other systems, and in what you've simply lost track of. This lesson covers three: <strong>Security Misconfiguration (API8)</strong>, <strong>SSRF (API7)</strong>, and <strong>Improper Inventory Management (API9)</strong>.</p>

      <h3>Security Misconfiguration (API8)</h3>
      <p>The catch-all for insecure defaults and sloppy settings. Common examples:</p>
      <ul>
        <li><strong>Verbose errors</strong> — a <code>500</code> that returns a full stack trace, framework version, and SQL query, handing attackers a map.</li>
        <li><strong>Missing security headers</strong> — no <code>Strict-Transport-Security</code>, <code>X-Content-Type-Options</code>, etc.</li>
        <li><strong>Overly permissive CORS</strong> — <code>Access-Control-Allow-Origin: *</code> on an authenticated API lets any website's script call it with the user's credentials.</li>
        <li><strong>Default credentials / open admin panels / debug endpoints left enabled</strong> in production.</li>
        <li><strong>Unnecessary HTTP methods</strong> enabled (e.g., <code>TRACE</code>, or <code>PUT</code>/<code>DELETE</code> where not needed).</li>
      </ul>
      <p>A leaky error is a gift to an attacker:</p>
      <pre><code>HTTP/1.1 500 Internal Server Error

{ "error": "SQLSTATE[42S02]: Base table 'prod.users' not found",
  "trace": "/app/src/db/QueryBuilder.php:142 ...",
  "framework": "Laravel 8.1.2" }</code></pre>
      <p>The fix: generic error messages to clients, detailed errors only in server-side logs, security headers set, CORS locked to known origins, defaults changed, and debug turned off in production.</p>

      <h3>Server-Side Request Forgery (API7 / SSRF)</h3>
      <p>SSRF happens when an API accepts a URL (or hostname) from the client and fetches it server-side — for example, "import my avatar from this URL." An attacker supplies an <em>internal</em> address instead:</p>
      <pre><code>POST /api/v1/import HTTP/1.1

{ "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/" }</code></pre>
      <p>That address is the cloud metadata service — reachable only from inside the network. If the server fetches it, the attacker may harvest cloud credentials. SSRF turns your trusted server into a proxy into your private network. Defence: validate and allowlist permitted destinations, block private/link-local IP ranges, and never let user input choose an arbitrary internal target.</p>

      <h3>Improper Inventory Management (API9)</h3>
      <p>You cannot defend what you don't know exists. API9 is the risk of <strong>shadow APIs</strong> (undocumented) and <strong>zombie APIs</strong> (old versions left running). A hardened <code>/api/v3/</code> means nothing if <code>/api/v1/</code> — with the BOLA bug you fixed two versions ago — is still online and reachable. Defence: maintain a complete, current API inventory (an OpenAPI/Swagger spec per version), retire deprecated versions, and treat non-production/staging endpoints as sensitive.</p>

      <blockquote>Theme of the lesson: <strong>secure the environment, not just the endpoint.</strong> Defaults, errors, trust relationships with other systems, and forgotten versions are exactly where attackers look once the obvious endpoints are locked down.</blockquote>
    `,
    quizzes: [
      { id: "api-l8-q1", question: "Why is a verbose 500 error a security problem?", options: ["It's slow", "It can leak stack traces, framework versions, and queries that map the system for attackers", "It uses too much bandwidth", "It disables the API"], correctAnswerIndex: 1, explanation: "Detailed error output gives attackers internal implementation details; clients should see generic errors." },
      { id: "api-l8-q2", question: "What risk does Access-Control-Allow-Origin: * pose on an authenticated API?", options: ["None, it's recommended", "Any website's script could call the API with the user's credentials", "It speeds up responses", "It encrypts requests"], correctAnswerIndex: 1, explanation: "Wide-open CORS on an authenticated API lets untrusted origins make credentialed cross-site requests." },
      { id: "api-l8-q3", question: "What is SSRF (API7)?", options: ["A password attack", "Tricking the server into fetching an attacker-supplied URL, often reaching internal systems", "A rate-limit bypass", "A logging feature"], correctAnswerIndex: 1, explanation: "Server-Side Request Forgery makes the trusted server issue requests to attacker-chosen, often internal, targets." },
      { id: "api-l8-q4", question: "Why is 169.254.169.254 a notable SSRF target in the cloud?", options: ["It's a public website", "It's the cloud metadata service that can expose credentials to anything inside the network", "It's a DNS server", "It's a test endpoint"], correctAnswerIndex: 1, explanation: "The link-local metadata endpoint can hand out cloud IAM credentials if reached via SSRF." },
      { id: "api-l8-q5", question: "Which is a correct SSRF defence?", options: ["Fetch any URL the client sends", "Allowlist permitted destinations and block private/link-local IP ranges", "Return verbose errors", "Enable open CORS"], correctAnswerIndex: 1, explanation: "Restrict outbound fetches to an allowlist and block internal/link-local addresses." },
      { id: "api-l8-q6", question: "What is a shadow API?", options: ["An encrypted endpoint", "An undocumented endpoint nobody is tracking or protecting", "A backup database", "A GraphQL feature"], correctAnswerIndex: 1, explanation: "Shadow APIs are undocumented, untracked endpoints — invisible to defenders, visible to attackers." },
      { id: "api-l8-q7", question: "Why is a leftover /api/v1/ dangerous if v3 is hardened?", options: ["It isn't dangerous", "The old version (a zombie API) may still expose bugs fixed in later versions", "v1 is always encrypted", "Old versions can't be reached"], correctAnswerIndex: 1, explanation: "Zombie APIs keep old, vulnerable code online; hardening a new version doesn't help if the old one is live." },
      { id: "api-l8-q8", question: "What is the best defence against Improper Inventory Management (API9)?", options: ["Delete all documentation", "Maintain a complete, current API inventory and retire deprecated versions", "Enable debug mode", "Open all CORS origins"], correctAnswerIndex: 1, explanation: "A current inventory (e.g., OpenAPI specs) and retiring old versions shrink the unknown attack surface." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // API Keys, Tokens, JWT, and OAuth 2.0",
    summary: "The machinery of API identity — API keys vs tokens, how JWTs work and fail, and what OAuth 2.0 actually delegates.",
    content: `
      <h2>How an API knows who's calling</h2>
      <p>Every authorization check depends on first establishing identity. This lesson covers the credentials APIs use, their trade-offs, and their pitfalls. Get the vocabulary precise — interviewers probe exactly here.</p>

      <h3>API keys vs tokens</h3>
      <table>
        <thead><tr><th></th><th>API Key</th><th>Token (e.g., JWT / OAuth access token)</th></tr></thead>
        <tbody>
          <tr><td>What it is</td><td>A long static secret string identifying an application/project</td><td>A short-lived credential representing an authenticated session/grant</td></tr>
          <tr><td>Identifies</td><td>Usually the <em>app</em>, not a specific end user</td><td>Often a specific <em>user</em> and their permissions (scopes)</td></tr>
          <tr><td>Lifetime</td><td>Long-lived until manually rotated</td><td>Short-lived; refreshed/expired</td></tr>
          <tr><td>Best for</td><td>Identifying/metering a client, low-sensitivity access</td><td>User authorization with fine-grained, expiring permissions</td></tr>
        </tbody>
      </table>
      <p>Key point: an API key is more of an <em>identifier</em> than a strong authenticator — it doesn't prove a user's identity or carry permissions well. Treat keys as secrets (never in client code or repos), scope them, and rotate them.</p>

      <h3>JWT — the JSON Web Token</h3>
      <p>A <strong>JWT</strong> is a self-contained token in three dot-separated Base64url parts: <code>header.payload.signature</code>.</p>
      <pre><code>eyJhbGciOiJIUzI1NiJ9  .  eyJzdWIiOiIxMDEiLCJyb2xlIjoidXNlciJ9  .  &lt;signature&gt;
     header (alg)                payload (claims)                signature</code></pre>
      <ul>
        <li><strong>Header</strong> — metadata, notably the signing algorithm (<code>alg</code>).</li>
        <li><strong>Payload</strong> — the claims: who the user is (<code>sub</code>), their role, expiry (<code>exp</code>), etc.</li>
        <li><strong>Signature</strong> — proves the token wasn't tampered with, computed with a secret (HMAC) or private key (RSA/ECDSA).</li>
      </ul>
      <p>The payload is only <strong>Base64-encoded, not encrypted</strong> — anyone can read it. So never put secrets in a JWT payload, and never trust an unverified token. Classic JWT failures:</p>
      <ul>
        <li><strong><code>alg: none</code></strong> — a token claiming "no signature." A server that honours it accepts a forged, unsigned token.</li>
        <li><strong>Algorithm confusion</strong> — tricking a server that expects RS256 into verifying an HS256 token using the public key as the HMAC secret.</li>
        <li><strong>Weak HMAC secret</strong> — a guessable signing key lets attackers forge valid tokens.</li>
        <li><strong>No expiry / no revocation</strong> — a stolen long-lived token is usable indefinitely.</li>
      </ul>
      <p>Defence: enforce a strong, expected algorithm server-side (reject <code>none</code>), use strong secrets/keys, set short <code>exp</code>, and validate every claim.</p>

      <h3>OAuth 2.0 — delegated authorization</h3>
      <p><strong>OAuth 2.0</strong> is a framework for <em>delegated authorization</em>: it lets a user grant a third-party app limited access to their data on another service <em>without sharing their password</em>. "Log in with Google" is OAuth. Core roles:</p>
      <ul>
        <li><strong>Resource owner</strong> — the user who owns the data.</li>
        <li><strong>Client</strong> — the app requesting access.</li>
        <li><strong>Authorization server</strong> — issues tokens after the user consents.</li>
        <li><strong>Resource server</strong> — the API that holds the data and honours the access token.</li>
      </ul>
      <p>Crucially: <strong>OAuth is about authorization, not authentication.</strong> For "who is this user" (authentication) the layer built on top of OAuth is <strong>OpenID Connect (OIDC)</strong>. Access tokens carry <strong>scopes</strong> — the specific permissions granted (e.g., <code>read:profile</code>). Least privilege applies: request only the scopes you need.</p>

      <blockquote>Interview trap: "Is OAuth an authentication protocol?" No — OAuth 2.0 is <em>authorization</em> (delegated access). Authentication on top of it is OpenID Connect. And a JWT payload is readable by anyone; its integrity, not its confidentiality, is what the signature protects.</blockquote>
    `,
    quizzes: [
      { id: "api-l9-q1", question: "What primarily distinguishes an API key from a user access token?", options: ["Keys expire faster", "An API key usually identifies an app and is long-lived; a token often represents a user with expiring, scoped permissions", "They are identical", "Keys are always encrypted"], correctAnswerIndex: 1, explanation: "API keys tend to identify applications and persist; tokens represent authenticated, scoped, short-lived grants." },
      { id: "api-l9-q2", question: "What are the three parts of a JWT?", options: ["host.path.query", "header.payload.signature", "user.role.expiry", "key.token.scope"], correctAnswerIndex: 1, explanation: "A JWT is header.payload.signature, each Base64url-encoded and dot-separated." },
      { id: "api-l9-q3", question: "Is a JWT payload encrypted?", options: ["Yes, fully encrypted", "No — it's only Base64-encoded and readable by anyone", "Only the header is readable", "It's compressed, not encoded"], correctAnswerIndex: 1, explanation: "The payload is Base64-encoded, not encrypted; the signature protects integrity, not confidentiality." },
      { id: "api-l9-q4", question: "What is the 'alg: none' JWT attack?", options: ["Using a stronger algorithm", "Presenting an unsigned token that a misconfigured server accepts as valid", "Encrypting the payload", "Rotating the key"], correctAnswerIndex: 1, explanation: "If the server honours 'alg: none', it accepts forged, unsigned tokens — a critical validation failure." },
      { id: "api-l9-q5", question: "What does the JWT signature protect?", options: ["The confidentiality of the payload", "The integrity — proof the token wasn't tampered with", "The network connection", "The user's password"], correctAnswerIndex: 1, explanation: "The signature verifies the token hasn't been altered; it does not hide the payload contents." },
      { id: "api-l9-q6", question: "What does OAuth 2.0 provide?", options: ["Authentication of a user's identity", "Delegated authorization — limited access to data without sharing the password", "Data encryption", "Rate limiting"], correctAnswerIndex: 1, explanation: "OAuth 2.0 is a delegated authorization framework; identity/authentication is added by OpenID Connect." },
      { id: "api-l9-q7", question: "Which layer built on OAuth 2.0 handles authentication (who the user is)?", options: ["SAML only", "OpenID Connect (OIDC)", "JWT alone", "CORS"], correctAnswerIndex: 1, explanation: "OpenID Connect sits on top of OAuth 2.0 to provide authentication of the end user." },
      { id: "api-l9-q8", question: "What do OAuth scopes represent, and how should they be assigned?", options: ["Server locations; assign broadly", "The specific permissions granted; request only what's needed (least privilege)", "Token lifetimes; make them long", "Encryption keys; share them"], correctAnswerIndex: 1, explanation: "Scopes define granted permissions; applying least privilege means requesting only the scopes actually required." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Injection, Input Validation, and Defensive API Design",
    summary: "Capstone — injection and input validation, then the layered architecture (gateway, WAF, schema, least privilege) that ties every defence together.",
    content: `
      <h2>The last flaw, and the whole defence</h2>
      <p>This capstone closes two loops: <strong>injection</strong> (with input validation as its cure) and the <strong>layered defensive design</strong> that unifies everything from Lessons 1–9 into an architecture.</p>

      <h3>Injection</h3>
      <p><strong>Injection</strong> occurs when untrusted input is interpreted as a command or query rather than as data. If a client value lands unescaped inside a database query, an attacker can rewrite the query's meaning:</p>
      <pre><code>GET /api/v1/users?name=admin' OR '1'='1
# If concatenated into SQL:  SELECT * FROM users WHERE name = 'admin' OR '1'='1'
# → returns every user</code></pre>
      <p>Injection has many forms — SQL, NoSQL, OS command, LDAP — but one root cause (mixing code and data) and one primary cure: <strong>never build commands by string concatenation.</strong> Use <strong>parameterised queries / prepared statements</strong> so input is always treated as data, never executable.</p>

      <h3>Input validation: validate, then handle</h3>
      <p>Alongside parameterisation, validate all input at the boundary:</p>
      <ul>
        <li><strong>Allowlist, don't blocklist</strong> — define what valid looks like (type, length, format, range) and reject everything else. Blocklists always miss a case.</li>
        <li><strong>Validate against a schema</strong> — an OpenAPI/JSON Schema definition lets the gateway reject malformed requests before they reach your code.</li>
        <li><strong>Encode on output</strong> — contextually encode data when it's used (e.g., to prevent stored XSS if API data is rendered in a browser).</li>
        <li><strong>Enforce types strictly</strong> — a field expecting an integer should reject <code>"1 OR 1=1"</code> outright.</li>
      </ul>

      <h3>Defensive design: layers, not a single wall</h3>
      <p>No single control is sufficient — you stack them (<strong>defence in depth</strong>). A mature API sits behind an architecture like this:</p>
      <table>
        <thead><tr><th>Layer</th><th>Role</th><th>Stops</th></tr></thead>
        <tbody>
          <tr><td><strong>API Gateway</strong></td><td>Single entry point; handles authN, routing, rate limiting, schema validation</td><td>Centralises controls; kills shadow endpoints (API8/API9)</td></tr>
          <tr><td><strong>WAF</strong></td><td>Pattern-based filtering of known-malicious payloads</td><td>Common injection & known exploit signatures</td></tr>
          <tr><td><strong>Rate limiting / quotas</strong></td><td>Bound consumption per client/key</td><td>Brute force & resource exhaustion (API2/API4)</td></tr>
          <tr><td><strong>AuthN + per-request AuthZ</strong></td><td>Verify identity AND object/function permission every call</td><td>BOLA & BFLA (API1/API5)</td></tr>
          <tr><td><strong>Schema / property allowlists</strong></td><td>Control fields in and out</td><td>Mass assignment & data exposure (API3)</td></tr>
          <tr><td><strong>TLS everywhere + least privilege</strong></td><td>Encrypt transit; minimal permissions for every component</td><td>Interception & blast-radius containment</td></tr>
        </tbody>
      </table>
      <p>Two caveats keep you honest. A <strong>WAF is a mitigation, not a fix</strong> — it filters known patterns but cannot understand your business logic, so it will never stop a BOLA attack (a perfectly well-formed request for someone else's object looks legitimate). And a gateway centralises controls but the <strong>authorization decision still belongs in the service</strong>, which alone knows who owns object 102.</p>

      <h3>The through-line of the whole course</h3>
      <blockquote>Say it plainly in an interview: <strong>API security is overwhelmingly about authorization and trust boundaries.</strong> Authenticate every caller, then authorize every request — at both the object and function level — validate all input against an allowlist, control every property in and out, bound consumption, and layer these behind a gateway and WAF while giving each component the least privilege it needs. Map each control to the OWASP API Top 10 and you can defend, explain, and design an API that holds.</blockquote>
    `,
    quizzes: [
      { id: "api-l10-q1", question: "What is the root cause of injection vulnerabilities?", options: ["Slow networks", "Untrusted input being interpreted as code/command instead of as data", "Too many requests", "Encrypted payloads"], correctAnswerIndex: 1, explanation: "Injection arises when input is mixed into a command/query and executed rather than treated purely as data." },
      { id: "api-l10-q2", question: "What is the primary cure for SQL injection?", options: ["Blocklisting bad words", "Parameterised queries / prepared statements that treat input as data", "Hiding the database", "Rate limiting"], correctAnswerIndex: 1, explanation: "Parameterised queries separate code from data so input can never alter the query's structure." },
      { id: "api-l10-q3", question: "Why is allowlisting preferred over blocklisting for input validation?", options: ["It's faster to type", "Defining what's valid and rejecting the rest avoids the gaps blocklists inevitably miss", "Blocklists are illegal", "Allowlists need no code"], correctAnswerIndex: 1, explanation: "Allowlists specify exactly what's acceptable; blocklists always miss some malicious variation." },
      { id: "api-l10-q4", question: "What is the role of an API gateway?", options: ["It stores the database", "A single entry point handling authentication, routing, rate limiting, and schema validation", "It replaces TLS", "It writes the application code"], correctAnswerIndex: 1, explanation: "A gateway centralises cross-cutting controls at one managed entry point in front of services." },
      { id: "api-l10-q5", question: "Why can a WAF NOT stop a BOLA attack?", options: ["WAFs are too slow", "A request for another user's object is perfectly well-formed; the WAF can't know the business ownership rules", "WAFs only work on GraphQL", "BOLA isn't a real attack"], correctAnswerIndex: 1, explanation: "WAFs match malicious patterns; a valid-looking request for someone else's object has no bad pattern to catch." },
      { id: "api-l10-q6", question: "In a layered design, where must the authorization decision ultimately live?", options: ["In the WAF", "In the service that knows who owns the object", "In the client app", "In the DNS server"], correctAnswerIndex: 1, explanation: "Only the service understands ownership/role rules, so per-request authorization belongs there — not solely at the edge." },
      { id: "api-l10-q7", question: "What does defence in depth mean for API security?", options: ["One very strong control", "Layering multiple independent controls so no single failure is catastrophic", "Encrypting data twice", "Blocking all traffic"], correctAnswerIndex: 1, explanation: "Stacking gateway, WAF, rate limits, auth, schema validation, TLS, and least privilege means one gap isn't fatal." },
      { id: "api-l10-q8", question: "What is the single biggest through-line of API security?", options: ["Faster servers", "Authorization and trust boundaries — authenticate every caller, then authorize every request", "Prettier documentation", "Larger payloads"], correctAnswerIndex: 1, explanation: "The dominant theme is authorization: verify identity, then check object- and function-level permission on every request." },
    ],
  },
];
