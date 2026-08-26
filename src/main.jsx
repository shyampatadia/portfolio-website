import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initClarity } from "@/utils/clarity";
import "./styles/globals.css";
import "./styles/responsive-refinements.css";

initClarity();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
