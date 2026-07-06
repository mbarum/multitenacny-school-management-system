import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AsyncLocalStorage } from "async_hooks";

// Custom error class for API exceptions
class HttpException extends Error {
  public statusCode: number;
  public code: string;
  public details: any;

  constructor(statusCode: number, message: string, code = "API_ERROR", details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Subclasses for common HTTP exceptions
class BadRequestException extends HttpException {
  constructor(message = "Bad Request", details: any = null) {
    super(400, message, "BAD_REQUEST", details);
  }
}

class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

class ForbiddenException extends HttpException {
  constructor(message = "Forbidden", details: any = null) {
    super(403, message, "FORBIDDEN", details);
  }
}

class NotFoundException extends HttpException {
  constructor(message = "Resource Not Found") {
    super(404, message, "NOT_FOUND");
  }
}

class UnprocessableEntityException extends HttpException {
  constructor(message = "Validation Failed", details: any = null) {
    super(422, message, "VALIDATION_ERROR", details);
  }
}

class RateLimitException extends HttpException {
  constructor(message = "Too Many Requests") {
    super(429, message, "TOO_MANY_REQUESTS");
  }
}

// ==========================================
// 1. ASYNC LOCAL STORAGE & REQUEST CONTEXT
// ==========================================
interface RequestContext {
  correlationId: string;
  tenantId?: string;
}

const contextStorage = new AsyncLocalStorage<RequestContext>();

// ==========================================
// 2. IN-MEMORY LOGGER WITH REAL-TIME STORAGE
// ==========================================
interface ServerLog {
  id: string;
  timestamp: string;
  correlationId: string;
  tenantId: string;
  source: "MIDDLEWARE" | "CONTROLLER" | "DB_ENGINE" | "INTERCEPTOR" | "FILTER";
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  durationMs?: number;
}

let SERVER_LOGS: ServerLog[] = [];

function addServerLog(
  correlationId: string,
  tenantId: string,
  source: ServerLog["source"],
  message: string,
  level: ServerLog["level"] = "INFO",
  durationMs?: number
) {
  const log: ServerLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    correlationId,
    tenantId,
    source,
    level,
    message,
    durationMs,
  };
  SERVER_LOGS.unshift(log);
  if (SERVER_LOGS.length > 200) {
    SERVER_LOGS = SERVER_LOGS.slice(0, 200);
  }
  // Print to console for traditional docker/server outputs
  console.log(`[${log.timestamp}] [${log.correlationId}] [Tenant: ${log.tenantId}] [${log.source}] [${log.level}] ${log.message}`);
}

// ==========================================
// 3. MULTI-TENANT SIMULATED DATABASE LAYER
// ==========================================
interface TenantDocument {
  id: number;
  tenantId: string;
  title: string;
  amount: number;
  confidentialNotes: string;
}

const DOCUMENTS_DB: TenantDocument[] = [
  { id: 101, tenantId: "acme-corp", title: "Q3 Strategy Proposal", amount: 45000, confidentialNotes: "Highly sensitive. Do not share outside ACME executive board." },
  { id: 102, tenantId: "acme-corp", title: "Enterprise Sales Invoice #2804", amount: 12000, confidentialNotes: "Payment pending verification by ACME finance." },
  { id: 103, tenantId: "stark-industries", title: "Arc Reactor Core Schematics", amount: 9500000, confidentialNotes: "Mark LXXXV specs. Encrypted with Stark Enterprise keys." },
  { id: 104, tenantId: "stark-industries", title: "Vibranium Acquisition Receipt", amount: 340000, confidentialNotes: "Procured from Wakanda official channels. Authorized by Pepper Potts." },
  { id: 105, tenantId: "wayne-enterprises", title: "Tactical Defense Suit Development", amount: 150000, confidentialNotes: "Prototype R&D allocation. Approved by Lucius Fox." },
  { id: 106, tenantId: "wayne-enterprises", title: "Satellite Network Annual Rent", amount: 89000, confidentialNotes: "Direct fiber connection to Batcave. Managed through Shell accounts." },
];

class MockDatabase {
  /**
   * Automated database-level query isolation filter.
   * Reads tenantId from the active AsyncLocalStorage execution context and automatically appends it.
   */
  static queryAll(): TenantDocument[] {
    const store = contextStorage.getStore();
    const activeTenantId = store?.tenantId;

    MockDatabase.log("QUERY RUNNING: SELECT * FROM documents");

    if (!activeTenantId) {
      MockDatabase.log(
        "CRITICAL ISOLATION ALERT: Database query triggered without active Tenant ID context! No tenant context exists. Enforcing query isolation fallback by returning empty list.",
        "WARNING"
      );
      return [];
    }

    MockDatabase.log(`AUTOMATED FILTER APPLIED: WHERE tenantId = '${activeTenantId}'`);
    return DOCUMENTS_DB.filter((doc) => doc.tenantId === activeTenantId);
  }

  /**
   * Database-level item retrieval with row-level validation context
   */
  static findById(id: number): TenantDocument | null {
    const store = contextStorage.getStore();
    const activeTenantId = store?.tenantId;

    MockDatabase.log(`QUERY RUNNING: SELECT * FROM documents WHERE id = ${id}`);

    const doc = DOCUMENTS_DB.find((d) => d.id === id);
    if (!doc) {
      MockDatabase.log(`Record with ID ${id} was not found in the global DB pool.`);
      return null;
    }

    // Row-level Security (RLS) query isolation guard
    if (!activeTenantId || doc.tenantId !== activeTenantId) {
      MockDatabase.log(
        `CROSS-TENANT ACCESS BLOCK: Active tenant '${activeTenantId || "UNKNOWN"}' attempted unauthorized query of document #${id} belonging to tenant '${doc.tenantId}'!`,
        "ERROR"
      );
      throw new ForbiddenException(
        `Access denied. Row-Level Security (RLS) validation failed. Cross-tenant queries are forbidden.`,
        {
          attemptedId: id,
          authorizedTenant: doc.tenantId,
          activeTenant: activeTenantId || "none",
        }
      );
    }

    MockDatabase.log(`SUCCESSFUL ACCESS GRANTED: Tenant '${activeTenantId}' verified to own document #${id}.`);
    return doc;
  }

  private static log(message: string, level: ServerLog["level"] = "INFO") {
    const store = contextStorage.getStore();
    const cid = store?.correlationId || "SYSTEM";
    const tid = store?.tenantId || "NONE";
    addServerLog(cid, tid, "DB_ENGINE", message, level);
  }
}

// Helper to generate custom request/correlation IDs
function generateCorrelationId(): string {
  return "req-" + Math.random().toString(36).substring(2, 8);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // 4. CORRELATION REQUEST-ID & TENANT CONTEXT MIDDLEWARE
  // ==========================================
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 1. Core Correlation ID extraction or generation
    const correlationId =
      (req.headers["x-correlation-id"] as string) ||
      (req.headers["x-request-id"] as string) ||
      generateCorrelationId();

    // 2. Multi-tenant Header identifier extraction
    const tenantId = (req.headers["x-tenant-id"] as string) || undefined;

    // 3. Inject tracing tokens into response headers for complete client feedback
    res.setHeader("X-Correlation-ID", correlationId);
    if (tenantId) {
      res.setHeader("X-Tenant-ID", tenantId);
    }
    res.locals.startTime = Date.now();

    // 4. Bind request lifecycle context to the current AsyncLocalStorage container
    contextStorage.run({ correlationId, tenantId }, () => {
      addServerLog(
        correlationId,
        tenantId || "NONE",
        "MIDDLEWARE",
        `HTTP Request Initialized: ${req.method} ${req.originalUrl}`
      );
      next();
    });
  });

  const apiRouter = express.Router();

  // ==========================================
  // 5. GLOBAL STANDARDIZED RESPONSE INTERCEPTOR
  // ==========================================
  apiRouter.use((req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    // Override res.json to structure a standardized client contract envelope
    res.json = function (body: any) {
      // If the body is already formatted by standard envelopes, bypass
      if (body && typeof body === "object" && "success" in body && "statusCode" in body) {
        return originalJson.call(this, body);
      }

      const store = contextStorage.getStore();
      const correlationId = store?.correlationId || "SYSTEM";
      const tenantId = store?.tenantId;

      const message = res.locals.message || "Request completed successfully";
      const meta = res.locals.meta || {};

      const start = res.locals.startTime || Date.now();
      const actualElapsed = Date.now() - start;
      const simulatedDelay = Math.floor(Math.random() * 65) + 12; // 12ms to 77ms
      const durationMs = actualElapsed + simulatedDelay;

      addServerLog(
        correlationId,
        tenantId || "NONE",
        "INTERCEPTOR",
        "Response Interceptor: Packing structured JSON envelope.",
        "INFO",
        durationMs
      );

      const standardizedPayload = {
        success: true,
        statusCode: res.statusCode || 200,
        message,
        data: body,
        meta: {
          ...meta,
          correlationId,
          tenantId: tenantId || null,
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      };

      return originalJson.call(this, standardizedPayload);
    };

    next();
  });

  // ==========================================
  // 6. STANDARD & SIMULATION API ROUTES
  // ==========================================

  // Success 1: Simple JSON response
  apiRouter.get("/users", (req: Request, res: Response) => {
    const store = contextStorage.getStore();
    addServerLog(store?.correlationId || "", store?.tenantId || "NONE", "CONTROLLER", "Users endpoint controller triggered.");
    const users = [
      { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
      { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Developer" },
      { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "Designer" },
    ];
    res.json(users);
  });

  // Success 2: Fetch profile with local request metadata details
  apiRouter.get("/users/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const store = contextStorage.getStore();
    addServerLog(store?.correlationId || "", store?.tenantId || "NONE", "CONTROLLER", `User profiles endpoint #${id} controller triggered.`);

    if (id !== 1 && id !== 2 && id !== 3) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const users: Record<number, any> = {
      1: { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
      2: { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Developer" },
      3: { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "Designer" },
    };

    res.locals.message = `Successfully retrieved profile for user ${id}`;
    res.locals.meta = {
      cached: false,
      permissions: ["read:profile", "write:profile"],
    };

    res.json(users[id]);
  });

  // Tenant API 1: Query multi-tenant document repository with automated isolation
  apiRouter.get("/tenant/documents", (req: Request, res: Response) => {
    const store = contextStorage.getStore();
    addServerLog(store?.correlationId || "", store?.tenantId || "NONE", "CONTROLLER", "Tenant documents collection controller triggered.");

    const documents = MockDatabase.queryAll();

    res.locals.message = `Successfully processed isolated tenant database query.`;
    res.locals.meta = {
      totalFound: documents.length,
      appliedStrategy: "AsyncLocalStorage Automated Row Filtering",
    };
    res.json(documents);
  });

  // Tenant API 2: Query a single document with active multi-tenant Row-Level validation
  apiRouter.get("/tenant/documents/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const store = contextStorage.getStore();
    addServerLog(store?.correlationId || "", store?.tenantId || "NONE", "CONTROLLER", `Tenant document controller triggered for document ID: ${id}`);

    const doc = MockDatabase.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} does not exist in the database.`);
    }

    res.locals.message = `Successfully validated owner authorization for document #${id}.`;
    res.json(doc);
  });

  // Simulations

  // Simulation: Attack bypass attempt (Maliciously read document owned by another tenant)
  apiRouter.get("/simulate/cross-tenant-attack", (req: Request, res: Response) => {
    const store = contextStorage.getStore();
    const targetedId = 103; // Stark Industries Core schematics (owned by stark-industries)
    addServerLog(
      store?.correlationId || "",
      store?.tenantId || "NONE",
      "CONTROLLER",
      `SIMULATION: Malicious attempt to query cross-tenant record ID ${targetedId} without owning authorization context.`
    );

    // This will trigger the findById method which contains Row-Level Guards
    const doc = MockDatabase.findById(targetedId);
    res.json(doc);
  });

  // Simulation: Missing tenant header simulation
  apiRouter.get("/simulate/no-tenant-context", (req: Request, res: Response) => {
    const store = contextStorage.getStore();
    addServerLog(
      store?.correlationId || "",
      store?.tenantId || "NONE",
      "CONTROLLER",
      "SIMULATION: Querying database with zero tenant header authentication identifiers."
    );

    const documents = MockDatabase.queryAll();
    res.locals.message = "Query executed successfully, returning fully isolated results.";
    res.json(documents);
  });

  // Standard exception simulations
  apiRouter.get("/simulate/bad-request", (req: Request, res: Response) => {
    throw new BadRequestException("The request payload is invalid or missing required params.", {
      missingFields: ["username", "password"],
    });
  });

  apiRouter.get("/simulate/unauthorized", (req: Request, res: Response) => {
    throw new UnauthorizedException("Your session token has expired or is invalid. Please sign in again.");
  });

  apiRouter.get("/simulate/forbidden", (req: Request, res: Response) => {
    throw new ForbiddenException("You do not have the required permissions ('admin:write') to access this resource.");
  });

  apiRouter.get("/simulate/not-found", (req: Request, res: Response) => {
    throw new NotFoundException("The requested API resource could not be found on this server.");
  });

  apiRouter.get("/simulate/validation-error", (req: Request, res: Response) => {
    throw new UnprocessableEntityException("The input data failed server-side security and form validation.", [
      { field: "email", issue: "Must be a valid email address containing @" },
      { field: "password", issue: "Must contain at least one uppercase letter, one digit, and be 8+ characters" },
      { field: "age", issue: "Must be a positive number greater than or equal to 18" },
    ]);
  });

  apiRouter.get("/simulate/rate-limit", (req: Request, res: Response) => {
    throw new RateLimitException("Rate limit exceeded. You have made more than 60 requests per minute.");
  });

  apiRouter.get("/simulate/crash", (req: Request, res: Response) => {
    const obj: any = null;
    return obj.somethingUndefined; // Throws TypeError
  });

  // Log Tail Engine fetch route
  apiRouter.get("/server-logs", (req: Request, res: Response) => {
    res.json(SERVER_LOGS);
  });

  // Logs clear route
  apiRouter.post("/server-logs/clear", (req: Request, res: Response) => {
    SERVER_LOGS = [];
    res.json({ cleared: true });
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // ==========================================
  // 7. GLOBAL STANDARDIZED EXCEPTION FILTER
  // ==========================================
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const store = contextStorage.getStore();
    const correlationId = store?.correlationId || "SYSTEM";
    const tenantId = store?.tenantId || "NONE";

    let statusCode = 500;
    let message = "Internal Server Error";
    let code = "INTERNAL_SERVER_ERROR";
    let details: any = null;

    if (err instanceof HttpException) {
      statusCode = err.statusCode;
      message = err.message;
      code = err.code;
      details = err.details;
    } else if (err instanceof Error) {
      message = err.message;
      code = err.name || "NATIVE_ERROR";
    }

    const start = res.locals.startTime || Date.now();
    const actualElapsed = Date.now() - start;
    const simulatedDelay = Math.floor(Math.random() * 55) + 15; // 15ms to 70ms
    const durationMs = actualElapsed + simulatedDelay;

    addServerLog(correlationId, tenantId, "FILTER", `Global Exception Filter Caught: [${code}] ${message}`, "ERROR", durationMs);

    const standardizedErrorPayload = {
      success: false,
      statusCode,
      error: {
        message,
        code,
        details,
        correlationId,
        tenantId: tenantId !== "NONE" ? tenantId : null,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };

    res.status(statusCode).json(standardizedErrorPayload);
  });

  // ==========================================
  // 8. VITE MIDDLEWARE & STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
