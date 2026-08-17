import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import StickFighter from "@/pages/stick-fighter";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StickFighter />
  </StrictMode>,
);
