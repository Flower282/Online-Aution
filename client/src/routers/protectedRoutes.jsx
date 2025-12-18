import Error from "../Error";
import { MainLayout } from "../layout/MainLayout";
import { ViewAuction } from "../pages/ViewAuction";
import { CreateAuction } from "../pages/CreateAuction";
import { MyAuction } from "../pages/MyAuction";
import Favorites from "../pages/Favorites";
import WonAuctions from "../pages/WonAuctions";
import MyDeposits from "../pages/MyDeposits";
import Profile from "../pages/Profile";
import Privacy from "../pages/Privacy";
import Dashboard from "../pages/Dashboard";

export const protectedRoutes = [
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Dashboard />,
        errorElement: <Error />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        errorElement: <Error />,
      },
      {
        path: "myauction",
        element: <MyAuction />,
        errorElement: <Error />,
      },
      {
        path: "favorites",
        element: <Favorites />,
        errorElement: <Error />,
      },
      {
        path: "won",
        element: <WonAuctions />,
        errorElement: <Error />,
      },
      {
        path: "deposits",
        element: <MyDeposits />,
        errorElement: <Error />,
      },
      {
        path: "create",
        element: <CreateAuction />,
        errorElement: <Error />,
      },
      {
        path: "auction/:id",
        element: <ViewAuction />,
        errorElement: <Error />,
      },
      {
        path: "profile",
        element: <Profile />,
        errorElement: <Error />,
      },
      {
        path: "privacy",
        element: <Privacy />,
        errorElement: <Error />,
      },
    ],
  },
];
