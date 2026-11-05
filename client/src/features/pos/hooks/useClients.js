import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api.js";

/** Client list for the pickers (with membership and wallet), reloadable after adding a client. */
export function useClients() {
  const [clients, setClients] = useState([]);
  const reload = useCallback(
    () =>
      api
        .get("/clients?pageSize=100")
        .then((r) => {
          setClients(r.data.data);
          return r.data.data;
        })
        .catch(() => []),
    [],
  );
  useEffect(() => {
    reload();
  }, [reload]);
  return { clients, reload };
}
