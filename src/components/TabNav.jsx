import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  FolderGit2,
  GraduationCap,
  NotebookText,
  UserRound,
} from "lucide-react";

import { tabConfig } from "@/content/portfolioContent";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabIcons = {
  about: UserRound,
  skills: Code2,
  experience: BriefcaseBusiness,
  education: GraduationCap,
  projects: FolderGit2,
  credentials: Award,
  writing: NotebookText,
  reading: BookOpen,
};

export function TabNav() {
  return (
    <section className="section-nav" aria-label="Portfolio sections">
      <TabsList className="section-tab-list">
        {tabConfig.map((tab) => {
          const Icon = tabIcons[tab.id] || UserRound;

          return (
            <TabsTrigger key={tab.id} value={tab.id} className="section-tab group">
              <Icon className="section-tab-icon" />
              <span className="section-tab-copy">
                <span className="section-tab-label">{tab.label}</span>
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </section>
  );
}
