import React from "react";

export default function StepIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <div className="flex items-center justify-between mb-2 w-full">
      <div className="flex items-center w-full">
        <div
          className={`flex items-center justify-center h-10 w-10 rounded-full ${
            currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {currentStep > 1 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            "1"
          )}
        </div>
        <div
          className={`flex-1 h-1 ${currentStep > 1 ? "bg-primary" : "bg-muted"}`}
        ></div>
        <div
          className={`flex items-center justify-center h-10 w-10 rounded-full ${
            currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {currentStep > 2 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            "2"
          )}
        </div>
        <div
          className={`flex-1 h-1 ${currentStep > 2 ? "bg-primary" : "bg-muted"}`}
        ></div>
        <div
          className={`flex items-center justify-center h-10 w-10 rounded-full ${
            currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {currentStep > 3 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            "3"
          )}
        </div>
        <div
          className={`flex-1 h-1 ${currentStep > 3 ? "bg-primary" : "bg-muted"}`}
        ></div>
        <div
          className={`flex items-center justify-center h-10 w-10 rounded-full ${
            currentStep >= 4 ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {currentStep > 4 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            "4"
          )}
        </div>
        <div
          className={`flex-1 h-1 ${currentStep > 4 ? "bg-primary" : "bg-muted"}`}
        ></div>
        <div
          className={`flex items-center justify-center h-10 w-10 rounded-full ${
            currentStep >= 5 ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          5
        </div>
      </div>
    </div>
  );
}
