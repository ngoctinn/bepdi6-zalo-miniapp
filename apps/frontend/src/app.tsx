import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ReactQueryProvider } from "./lib/react-query-provider";
import React, { useEffect } from "react";
import { AppToastContainer } from "@/hooks/use-app-toast";
import { initStoredTokens } from "./lib/api-client";

export default function MiniApp() {
  useEffect(() => {
    void initStoredTokens();
  }, []);

  return (
    <React.StrictMode>
      <ReactQueryProvider>
        <RouterProvider router={router} />
        <AppToastContainer />
      </ReactQueryProvider>
    </React.StrictMode>
  );
}
