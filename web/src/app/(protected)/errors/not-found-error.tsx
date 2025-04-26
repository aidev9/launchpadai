import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NotFoundError() {
  const router = useRouter();
  const handleBack = () => router.back();

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] font-bold leading-tight">404</h1>
        <span className="font-medium">Page Not Found</span>
        <p className="text-center text-muted-foreground">
          The page you are looking for doesn't exist <br /> or has been moved.
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={handleBack}>
            Go Back
          </Button>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
