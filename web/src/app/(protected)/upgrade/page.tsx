import { redirect } from "next/navigation";
import UpgradeForm from "./components/upgrade-form";
import { getUser } from "@/lib/firebase/actions/auth";

// Define a serializable user type
interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export default async function UpgradePage() {
  // Get the authenticated user
  const user = await getUser();

  // Redirect to signin if not logged in
  if (!user) {
    redirect("/auth/signin");
  }

  // Create a serializable version of the user object with only the necessary properties
  const serializableUser: SerializableUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upgrade Your Subscription</h1>
      <UpgradeForm user={serializableUser} />
    </div>
  );
}
