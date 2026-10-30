import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/app/router";
import { bootstrapData } from "@/lib/bootstrap";
import { startAtTopOnReload } from "@/lib/scroll";
import "@/styles/index.css";

startAtTopOnReload();

const queryClient = new QueryClient();

void bootstrapData().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
