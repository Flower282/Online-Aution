import { AdminLayout } from "../layout/AdminLayout";
import { AdminDashboard } from "../pages/Admin/AdminDashboard";
import { UsersList } from "../pages/Admin/UsersList";
import PendingAuctions from "../pages/Admin/PendingAuctions";
import VerificationManagement from "../pages/Admin/VerificationManagement";

export const adminRouter = [
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "users",
        element: <UsersList />,
      },
      {
        path: "auctions/pending",
        element: <PendingAuctions />,
      },
      {
        path: "verifications",
        element: <VerificationManagement />,
      },
    ],
  },
];