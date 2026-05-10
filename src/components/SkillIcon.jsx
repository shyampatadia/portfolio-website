import { useState } from "react";

import { cn } from "@/lib/utils";

const ICON_SLUGS = {
  Python: "python",
  "C# / .NET": "dotnet",
  "C#/.NET": "dotnet",
  ".NET Core": "dotnet",
  SQL: "sqlite",
  Java: "openjdk",
  Julia: "julia",
  JavaScript: "javascript",
  "Bash / PowerShell": "powershell",
  PowerShell: "powershell",
  "C++": "cplusplus",
  CUDA: "nvidia",
  "LLMs & VLMs": "openai",
  "RAG Architecture": "langchain",
  "LLMs": "openai",
  "VLMs": "openai",
  PyTorch: "pytorch",
  LangChain: "langchain",
  CrewAI: "openai",
  LangGraph: "langchain",
  DSPy: "python",
  vLLM: "python",
  NLP: "huggingface",
  PySpark: "apachespark",
  Pandas: "pandas",
  "Scikit-learn": "scikitlearn",
  Selenium: "selenium",
  Playwright: "playwright",
  PyTest: "pytest",
  SpecFlow: "cucumber",
  Appium: "appium",
  Cucumber: "cucumber",
  Postman: "postman",
  AWS: "amazonwebservices",
  Azure: "microsoftazure",
  Docker: "docker",
  Kubernetes: "kubernetes",
  Terraform: "terraform",
  "CI/CD Pipelines": "githubactions",
  Redis: "redis",
  "SQL Server": "microsoftsqlserver",
  MySQL: "mysql",
  PostgreSQL: "postgresql",
  MongoDB: "mongodb",
  DynamoDB: "amazondynamodb",
  "Vector Databases": "pinecone",
  "Vector DBs": "pinecone",
  Mem0: "openai",
  Tableau: "tableau",
  "Power BI": "powerbi",
  FastAPI: "fastapi",
  Flask: "flask",
  Django: "django",
  "AI/ML": "openai",
  BERT: "huggingface",
  Finance: "stripe",
  Jira: "jira",
  GxP: "readthedocs",
  Agile: "scrumalliance",
  "Web Scraping": "python",
  JSON: "json",
  Streamlit: "streamlit",
  "Git/GitHub": "github",
  GitHub: "github",
  Git: "git",
  "Azure DevOps": "azuredevops",
  NuGet: "nuget",
  ".NET": "dotnet",
  "xLMCore": "dotnet",
  WinAppDriver: "windows",
};

function initials(label) {
  return label
    .replace(/[^a-zA-Z0-9+#. ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SkillIcon({ label, className }) {
  const [failed, setFailed] = useState(false);
  const slug = ICON_SLUGS[label];

  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50/90 text-[10px] font-bold text-slate-600",
        className,
      )}
      aria-hidden="true"
    >
      {slug && !failed ? (
        <img
          src={`https://cdn.simpleicons.org/${slug}?viewbox=auto`}
          alt=""
          className="h-4 w-4 object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(label)
      )}
    </span>
  );
}

export function TechBadge({ label, variant = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium leading-tight",
        variant === "accent"
          ? "border-orange-200 bg-orange-50 text-slate-950"
          : "border-slate-200 bg-[rgba(255,252,246,0.86)] text-slate-700",
      )}
    >
      <SkillIcon label={label} />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
