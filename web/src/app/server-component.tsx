import { adminDb } from "@/lib/firebase/admin";

// This async function demonstrates server-side Firebase Admin SDK usage
// Note: In a real app, this would typically be in an API route or React Server Component
async function getServerSideData() {
  try {
    // Safely handle the case where Firebase credentials aren't configured
    if (!process.env.FIREBASE_PROJECT_ID) {
      return {
        message:
          "Firebase Admin SDK not configured. Please check your environment variables.",
      };
    }

    // Example of a Firestore collection read - wrapped in try/catch for safety
    // In a real app, you would read actual data and properly type it
    const snapshot = await adminDb.collection("waitlist").limit(5).get();
    const examples = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { examples };
  } catch (error) {
    console.error("Error fetching server data:", error);
    return {
      error: "Failed to fetch data from Firestore",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function ServerComponent() {
  // This data is fetched on the server side using Firebase Admin SDK
  const data = await getServerSideData();

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Server Component Data</h2>
      <div className="p-4 bg-muted rounded-md">
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
