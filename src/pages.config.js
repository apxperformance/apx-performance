import BrowseCoaches from './pages/BrowseCoaches';
import CheckInJournal from './pages/CheckInJournal';
import ClientCalendar from './pages/ClientCalendar';
import ClientChat from './pages/ClientChat';
import ClientDashboard from './pages/ClientDashboard';
import ClientManagement from './pages/ClientManagement';
import ClientProfile from './pages/ClientProfile';
import CoachDashboard from './pages/CoachDashboard';
import CoachSettings from './pages/CoachSettings';
import CoachingCalendar from './pages/CoachingCalendar';
import FoodTracker from './pages/FoodTracker';
import FreeClientDashboard from './pages/FreeClientDashboard';
import Home from './pages/Home';
import MyNutrition from './pages/MyNutrition';
import MyProgress from './pages/MyProgress';
import MySupplements from './pages/MySupplements';
import MyWorkouts from './pages/MyWorkouts';
import NutritionPlanner from './pages/NutritionPlanner';
import ProgressReviews from './pages/ProgressReviews';
import SupplementPlanner from './pages/SupplementPlanner';
import Welcome from './pages/Welcome';
import WorkoutBuilder from './pages/WorkoutBuilder';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BrowseCoaches": BrowseCoaches,
    "CheckInJournal": CheckInJournal,
    "ClientCalendar": ClientCalendar,
    "ClientChat": ClientChat,
    "ClientDashboard": ClientDashboard,
    "ClientManagement": ClientManagement,
    "ClientProfile": ClientProfile,
    "CoachDashboard": CoachDashboard,
    "CoachSettings": CoachSettings,
    "CoachingCalendar": CoachingCalendar,
    "FoodTracker": FoodTracker,
    "FreeClientDashboard": FreeClientDashboard,
    "Home": Home,
    "MyNutrition": MyNutrition,
    "MyProgress": MyProgress,
    "MySupplements": MySupplements,
    "MyWorkouts": MyWorkouts,
    "NutritionPlanner": NutritionPlanner,
    "ProgressReviews": ProgressReviews,
    "SupplementPlanner": SupplementPlanner,
    "Welcome": Welcome,
    "WorkoutBuilder": WorkoutBuilder,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};