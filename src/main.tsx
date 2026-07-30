import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import { ProjectStoreProvider } from "./context/ProjectStoreContext";
import { TaskStoreProvider } from "./context/TaskStoreContext";
import App from "./App";
import "./index.css";

Amplify.configure(outputs);

// Persistent providers are mounted once here, at the app root, rather than
// inside App's own tree (CODING_GUIDELINES.md #4) — both need a signed-in
// user, so they nest inside Authenticator, which only renders its children
// once sign-in has succeeded.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Authenticator>
      <ProjectStoreProvider>
        <TaskStoreProvider>
          <App />
        </TaskStoreProvider>
      </ProjectStoreProvider>
    </Authenticator>
  </StrictMode>,
);
