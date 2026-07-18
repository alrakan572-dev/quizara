import type { AppLanguage } from "../../api";
import { ChallengesPage } from "./ChallengesPage";
interface Props { onBack: () => void; userPoints: number; onPointsUpdate: (points: number) => void; language?: AppLanguage; }
export function DailyChallengePage(props: Props) { return <ChallengesPage {...props} scope="daily" />; }
