import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileNavigation from "@/components/MobileNavigation";
import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: ReactNode }) => {
  const loggedInUser = await getCurrentUser();
  if (!loggedInUser) return redirect("/sign-in");

  return (
    <div className="flex h-screen">
      <Sidebar fullName={loggedInUser.fullName} email={loggedInUser.email} />
      <section className="flex h-full flex-1 flex-col">
        <Header />
        <MobileNavigation />
        <main className="main-content">{children}</main>
      </section>
    </div>
  );
};

export default Layout;
