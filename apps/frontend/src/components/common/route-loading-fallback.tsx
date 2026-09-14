import React from "react";
import { Spinner } from "zmp-ui";

export function RouteLoadingFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Spinner logo />
    </div>
  );
}
