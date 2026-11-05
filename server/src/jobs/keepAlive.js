import { logger } from "../core/logger/logger.js";

let keepAliveTimer = null;

export function startKeepAlive(url, intervalMin = 10) {
  // Keep-alive disabled when URL is empty
  if (!url) {
    logger.info("Keep-alive disabled: KEEP_ALIVE_URL is empty");
    return () => {};
  }

  // Prevent duplicate timers
  if (keepAliveTimer) {
    return () => {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    };
  }

  const interval = intervalMin * 60 * 1000;
  let pingInProgress = false;

  const ping = async () => {
    if (pingInProgress) return;

    pingInProgress = true;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(
          { status: response.status },
          "Keep-alive ping returned an error",
        );
      } else {
        logger.info({ status: response.status }, "Keep-alive ping successful");
      }
    } catch (error) {
      logger.warn({ err: error }, "Keep-alive ping failed");
    } finally {
      pingInProgress = false;
    }
  };

  // Start the timer
  keepAliveTimer = setInterval(ping, interval);

  // Don't prevent graceful process shutdown
  keepAliveTimer.unref?.();

  logger.info({ url, intervalMin }, "Keep-alive started");

  // Return cleanup function for server.js
  return () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
      logger.info("Keep-alive stopped");
    }
  };
}
