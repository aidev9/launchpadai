// A simple toast implementation
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

// Since we don't have a full toast implementation, we'll use console for now
export function toast(props: ToastProps) {
  const { title, description, variant = "default" } = props;

  if (variant === "destructive") {
    console.error(`Toast (${title}): ${description}`);
  } else {
    console.log(`Toast (${title}): ${description}`);
  }

  // In a real implementation, this would show a toast notification
  // Return empty object as placeholder for future implementation
  return {};
}

// Mock hook that returns the toast function
export function useToast() {
  return {
    toast,
  };
}
