import Welcome from './pages/Welcome';
import CoachDashboard from './pages/CoachDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ClientManagement from './pages/ClientManagement';
import MyWorkouts from './pages/MyWorkouts';
import MyNutrition from './pages/MyNutrition';
import CheckInJournal from './pages/CheckInJournal';
import WorkoutBuilder from './pages/WorkoutBuilder';
import NutritionPlanner from './pages/NutritionPlanner';
import ProgressReviews from './pages/ProgressReviews';
import CoachSettings from './pages/CoachSettings';
import MyProgress from './pages/MyProgress';
import FoodTracker from './pages/FoodTracker';
import FreeClientDashboard from './pages/FreeClientDashboard';
import SupplementPlanner from './pages/SupplementPlanner';
import MySupplements from './pages/MySupplements';
import ClientProfile from './pages/ClientProfile';
import ClientChat from './pages/ClientChat';
import CoachingCalendar from './pages/CoachingCalendar';
import ClientCalendar from './pages/ClientCalendar';
import BrowseCoaches from './pages/BrowseCoaches';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Welcome": Welcome,
    "CoachDashboard": CoachDashboard,
    "ClientDashboard": ClientDashboard,
    "ClientManagement": ClientManagement,
    "MyWorkouts": MyWorkouts,
    "MyNutrition": MyNutrition,
    "CheckInJournal": CheckInJournal,
    "WorkoutBuilder": WorkoutBuilder,
    "NutritionPlanner": NutritionPlanner,
    "ProgressReviews": ProgressReviews,
    "CoachSettings": CoachSettings,
    "MyProgress": MyProgress,
    "FoodTracker": FoodTracker,
    "FreeClientDashboard": FreeClientDashboard,
    "SupplementPlanner": SupplementPlanner,
    "MySupplements": MySupplements,
    "ClientProfile": ClientProfile,
    "ClientChat": ClientChat,
    "CoachingCalendar": CoachingCalendar,
    "ClientCalendar": ClientCalendar,
    "BrowseCoaches": BrowseCoaches,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};