import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ReactQueryProvider } from "./lib/react-query-provider";
import React, { useEffect, useState } from "react";
import { AppToastContainer } from "@/hooks/use-app-toast";
import { initStoredTokens } from "./lib/api-client";
import { Spinner } from "zmp-ui";

export default function MiniApp() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    initStoredTokens().finally(() => {
      setIsHydrated(true);
    });
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <Spinner logo />
      </div>
    );
  }

  return (
    <React.StrictMode>
      <ReactQueryProvider>
        <RouterProvider router={router} />
        <AppToastContainer />
      </ReactQueryProvider>
    </React.StrictMode>
  );
}
