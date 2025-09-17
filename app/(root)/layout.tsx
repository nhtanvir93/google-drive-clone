import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileNavigation from "@/components/MobileNavigation";
import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

const Layout = async ({ children }: { children: ReactNode }) => {
  const loggedInUser = await getCurrentUser();
  if (!loggedInUser) return redirect("/sign-in");

  return (
    <div className="flex h-screen">
      <Sidebar {...loggedInUser} />
      <section className="flex h-full flex-1 flex-col">
        <Header
          userId={loggedInUser.$id}
          sessionUserId={loggedInUser.sessionUserId}
        />
        <MobileNavigation {...loggedInUser} />
        <main className="main-content">{children}</main>
      </section>
      <Toaster />
    </div>
  );
};

export default Layout;
