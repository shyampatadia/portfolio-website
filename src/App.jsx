import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { AboutSection } from "@/components/AboutSection";
import { BlogSection } from "@/components/BlogSection";
import { BooksSection } from "@/components/BooksSection";
import { CredentialsSection } from "@/components/CredentialsSection";
import { EducationSection } from "@/components/EducationSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { Hero } from "@/components/Hero";
import { ProjectsSection } from "@/components/ProjectsSection";
import { SkillsSection } from "@/components/SkillsSection";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { heroContent } from "@/content/portfolioContent";

const HASH_TO_TAB = {
  summary: "about",
  about: "about",
  skills: "skills",
  experience: "experience",
  education: "education",
  projects: "projects",
  certifications: "credentials",
  credentials: "credentials",
  blog: "writing",
  writing: "writing",
  bookshelf: "reading",
  reading: "reading",
};

function getInitialTab() {
  const hash = window.location.hash.replace("#", "").trim().toLowerCase();
  return HASH_TO_TAB[hash] || "about";
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const deferredTab = useDeferredValue(activeTab);

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    function handleHashChange() {
      setActiveTab(getInitialTab());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const sections = useMemo(
    () => ({
      about: <AboutSection />,
      skills: <SkillsSection />,
      experience: <ExperienceSection />,
      education: <EducationSection />,
      projects: <ProjectsSection />,
      credentials: <CredentialsSection />,
      writing: <BlogSection />,
      reading: <BooksSection />,
    }),
    [],
  );

  return (
    <div className="page-shell">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="page-canvas">
          <Hero onPrimaryAction={() => setActiveTab("experience")} />
          <TabNav />

          <main className="workspace-shell">
            <div className="workspace-content">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={deferredTab}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  {sections[deferredTab]}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="workspace-footer">
              <div>
                <p className="section-kicker">
                  Contact
                </p>
                <h2 className="mt-3 type-card-title">
                  Let&apos;s connect
                </h2>
                <p className="mt-2 max-w-2xl type-body-sm">
                  If you are building around AI systems, automation, validation, or engineering
                  infrastructure, I&apos;m open to the right conversation.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={heroContent.emailHref}>Email Me</a>
                </Button>
                <Button variant="secondary" asChild>
                  <a
                    href="https://www.linkedin.com/in/shyampatadia/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                </Button>
              </div>
            </footer>
          </main>
        </div>
      </Tabs>
    </div>
  );
}
