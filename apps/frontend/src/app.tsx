import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ReactQueryProvider } from "./lib/react-query-provider";
import React from "react";
import { AppToastContainer } from "@/hooks/use-app-toast";

export default function MiniApp() {
  return (
    <React.StrictMode>
      <ReactQueryProvider>
        <RouterProvider router={router} />
        <AppToastContainer />
      </ReactQueryProvider>
    </React.StrictMode>
  );
}
