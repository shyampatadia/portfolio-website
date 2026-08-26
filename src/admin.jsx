import React from "react";
import ReactDOM from "react-dom/client";

import { AdminApp } from "@/admin/AdminApp";
import "./styles/admin.css";

// No Clarity here on purpose: the admin panel is not visitor traffic, and the
// analytics pipeline filters this path on both the client and the server.
ReactDOM.createRoot(document.getElementById("admin-root")).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
