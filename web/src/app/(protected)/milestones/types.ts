export enum StepStatus {
  Upcoming = "upcoming",
  Current = "current",
  Completed = "completed",
}

export interface Step {
  id: number;
  title: string;
  description: string;
  duration: string;
  status: StepStatus;
}

export interface MilestoneProps {
  step: Step;
  alignLeft: boolean;
}
