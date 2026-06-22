import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Trophy, User } from "lucide-react";
import { HomePage } from "./components/HomePage";
import { LeaderboardPage } from "./components/LeaderboardPage";
import { ProfilePage } from "./components/ProfilePage";
import { RiddlesPage } from "./components/RiddlesPage";
import { GeneralKnowledgePage } from "./components/GeneralKnowledgePage";
import { DailyChallengePage } from "./components/DailyChallengePage";
import { FastestPage } from "./components/FastestPage";
import { LuckyBoxPage } from "./components/LuckyBoxPage";
import { VIPPage } from "./components/VIPPage";
import { RewardsPage } from "./components/RewardsPage";
import { InviteFriendsPage } from "./components/InviteFriendsPage";
import { SettingsPage } from "./components/SettingsPage";
import { FindDifferencePage } from "./components/FindDifferencePage";
import { WeeklyChallengePage } from "./components/WeeklyChallengePage";
import { EditProfilePage } from "./components/EditProfilePage";

type Page = "home" | "leaderboard" | "profile" | "riddles" | "general-knowledge" | "daily-challenge" | "fastest" | "lucky-box" | "vip" | "rewards" | "invite" | "settings" | "find-difference" | "weekly-challenge" | "edit-profile";

const NAV_ITEMS: { id: Page; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
];

const BOTTOM_NAV_PAGES: Page[] = ["home", "leaderboard", "profile"];

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [userPoints, setUserPoints] = useState(48250);

  const handleNavigate = (p: string) => setActivePage(p as Page);

  const showBottomNav = BOTTOM_NAV_PAGES.includes(activePage);

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{
        background: "#111827",
        fontFamily: "'Inter', sans-serif",
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Top header bar */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-30"
        style={{
          background: "rgba(17,24,39,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(109,40,217,0.2)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{
              background: "linear-gradient(135deg, #6D28D9, #4C1D95)",
              boxShadow: "0 0 12px rgba(109,40,217,0.5)",
            }}
          >
            🧠
          </div>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 800,
              fontSize: "1.35rem",
              background: "linear-gradient(90deg, #A78BFA, #FBBF24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.05em",
            }}
          >
            QUIZORA
          </span>
        </div>

        {/* Points chip */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.3)",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>🪙</span>
          <motion.span
            key={userPoints}
            initial={{ scale: 1.2, color: "#6EE7B7" }}
            animate={{ scale: 1, color: "#FBBF24" }}
            transition={{ duration: 0.4 }}
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "inline-block",
            }}
          >
            {userPoints.toLocaleString()}
          </motion.span>
        </div>
      </header>

      {/* Page content */}
      <main
        className="flex-1 overflow-y-auto px-4 pt-4"
        style={{
          paddingBottom: showBottomNav ? 80 : 16,
          scrollbarWidth: "none",
        }}
      >
        <style>{`main::-webkit-scrollbar { display: none; }`}</style>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {activePage === "home" && (
              <HomePage onNavigate={handleNavigate} userPoints={userPoints} />
            )}
            {activePage === "leaderboard" && <LeaderboardPage />}
            {activePage === "profile" && <ProfilePage onNavigate={handleNavigate} />}
            {activePage === "riddles" && (
              <RiddlesPage
                onBack={() => setActivePage("home")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "general-knowledge" && (
              <GeneralKnowledgePage
                onBack={() => setActivePage("home")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "daily-challenge" && (
              <DailyChallengePage
                onBack={() => setActivePage("home")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "fastest" && (
              <FastestPage
                onBack={() => setActivePage("home")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "lucky-box" && (
              <LuckyBoxPage
                onBack={() => setActivePage("home")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "vip" && (
              <VIPPage
                onBack={() => setActivePage("profile")}
                userPoints={userPoints}
              />
            )}
            {activePage === "rewards" && (
              <RewardsPage
                onBack={() => setActivePage("profile")}
                userPoints={userPoints}
              />
            )}
            {activePage === "invite" && (
              <InviteFriendsPage
                onBack={() => setActivePage("profile")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "settings" && (
              <SettingsPage onBack={() => setActivePage("profile")} />
            )}
            {activePage === "find-difference" && (
              <FindDifferencePage
                onBack={() => setActivePage("home")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "weekly-challenge" && (
              <WeeklyChallengePage
                onBack={() => setActivePage("home")}
                userPoints={userPoints}
                onPointsUpdate={setUserPoints}
              />
            )}
            {activePage === "edit-profile" && (
              <EditProfilePage
                onBack={() => setActivePage("profile")}
                userPoints={userPoints}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation — hidden on sub-pages like riddles */}
      <AnimatePresence>
        {showBottomNav && (
          <motion.nav
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full flex items-center justify-around px-2 py-2 z-40"
            style={{
              maxWidth: 430,
              background: "rgba(17,24,39,0.96)",
              backdropFilter: "blur(16px)",
              borderTop: "1px solid rgba(109,40,217,0.25)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className="flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl relative"
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: "rgba(109,40,217,0.2)", border: "1px solid rgba(109,40,217,0.35)" }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                  <Icon
                    size={20}
                    style={{ color: isActive ? "#A78BFA" : "#4B5563", transition: "color 0.2s", position: "relative", zIndex: 1 }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.65rem",
                      color: isActive ? "#A78BFA" : "#4B5563",
                      letterSpacing: "0.04em",
                      transition: "color 0.2s",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {item.label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
