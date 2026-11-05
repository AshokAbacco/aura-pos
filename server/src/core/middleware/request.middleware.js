import crypto from "node:crypto";
import pinoHttp from "pino-http";
import { logger } from "../logger/logger.js";

/** Give every request an id (echoed in x-request-id) so logs and error reports can be correlated. */
export function requestId(req, res, next) {
  const incoming = req.get("x-request-id");
  req.id =
    incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.set("x-request-id", req.id);
  next();
}

/** Structured access log — no headers, cookies, bodies or query strings (may carry PII/tokens). */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  autoLogging: {
    ignore: (req) => /^\/(api\/v1\/)?(health|ready)\b/.test(req.url),
  }, // uptime pings would flood the log
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      path: req.url.split("?")[0],
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
