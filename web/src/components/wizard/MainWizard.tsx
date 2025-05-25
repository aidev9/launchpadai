import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import { useXpMutation } from "@/xp/useXpMutation";
import {
  completedMiniWizardsAtom,
  globalWizardStepAtom,
  wizardNavigationAtom,
  currentWizardInfoAtom,
  canNavigateAtom,
  WIZARD_STEP_DEFINITIONS,
  TOTAL_WIZARDS,
} from "@/lib/atoms/wizard";
import {
  selectedProductAtom,
  selectedBusinessStackAtom,
  selectedTechStackAtom,
  autoSyncProductAtom,
  initializeSelectedProductAtom,
} from "@/lib/store/product-store";
import WizardLayout from "./WizardLayout";
import WizardIntroduction from "./WizardIntroduction";
import WizardCelebration from "./WizardCelebration";
import WizardCompletion from "./WizardCompletion";
import CreateProductWizard from "./mini-wizards/CreateProductWizard";
import CreateBusinessStackWizard from "./mini-wizards/CreateBusinessStackWizard";
import CreateTechnicalStackWizard from "./mini-wizards/CreateTechnicalStackWizard";
import Create360QuestionsStackWizard from "./mini-wizards/Create360QuestionsStackWizard";
import CreateRulesStackWizard from "./mini-wizards/CreateRulesStackWizard";
import AddFeaturesWizard from "./mini-wizards/AddFeaturesWizard";
import AddCollectionsWizard from "./mini-wizards/AddCollectionsWizard";
import AddNotesWizard from "./mini-wizards/AddNotesWizard";
import { useToast } from "@/components/ui/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";
import { UserProfile } from "@/lib/firebase/schema";
import { firebaseUsers } from "@/lib/firebase/client/FirebaseUsers";
import { useDocumentData } from "react-firebase-hooks/firestore";

export default function MainWizard() {
  const router = useRouter();

  // Get the current user from React Firebase Hooks (Auth)
  const [_user, loading, _error] = useAuthState(clientAuth);

  // Load user profile using React Firebase Hooks
  const userProfileRef = firebaseUsers.getRefUser();
  const [userProfile, userProfileLoading, _userProfileError] =
    useDocumentData<UserProfile>(userProfileRef, {
      snapshotListenOptions: { includeMetadataChanges: false },
    });

  const isLoading = loading || userProfileLoading;

  // Global wizard navigation state
  const [globalStep] = useAtom(globalWizardStepAtom);
  const [, navigate] = useAtom(wizardNavigationAtom);
  const wizardInfo = useAtom(currentWizardInfoAtom)[0];
  const navigation = useAtom(canNavigateAtom)[0];

  // Selected entity atoms for determining create vs update
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [selectedBusinessStack] = useAtom(selectedBusinessStackAtom);
  const [selectedTechStack] = useAtom(selectedTechStackAtom);

  // Initialize selected product from storage
  const [, setInitialize] = useAtom(initializeSelectedProductAtom);

  // Initialize the selected product on component mount
  useEffect(() => {
    setInitialize();
  }, [setInitialize]);

  // Legacy state for celebration and completion tracking
  const [completedMiniWizards, setCompletedMiniWizards] = useAtom(
    completedMiniWizardsAtom
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationXp, setCelebrationXp] = useState(0);
  const [completedWizardId, setCompletedWizardId] =
    useState<MiniWizardId | null>(null);

  // Use the common XP mutation hook for awarding XP
  const xpMutation = useXpMutation();

  // Toast hook
  const { toast } = useToast();

  // Handle navigation
  const handleNext = async () => {
    const [mainStep, subStep] = globalStep;
    const currentWizard =
      WIZARD_STEP_DEFINITIONS[mainStep as keyof typeof WIZARD_STEP_DEFINITIONS];

    // Handle completion step - redirect to dashboard
    if (mainStep === 9) {
      router.push("/dashboard");
      return;
    }

    // For questions wizard, auto-save before navigation
    if (mainStep === 4) {
      const questionsWizard = (window as any).currentQuestionsWizard;
      if (questionsWizard && questionsWizard.onNavigateToNext) {
        await questionsWizard.onNavigateToNext();
      }
    }

    // Check if we're on the final step of a wizard and need to submit
    if (subStep === currentWizard.totalSteps) {
      // We're on the final step of a wizard - trigger form submission
      switch (mainStep) {
        case 1: // Product wizard
          const productWizard = (window as any).currentProductWizard;
          if (productWizard && productWizard.handleFinalSubmit) {
            productWizard.handleFinalSubmit();
          }
          break;
        case 2: // Business stack wizard
          const businessWizard = (window as any).currentBusinessStackWizard;
          if (businessWizard && businessWizard.submitForm) {
            businessWizard.submitForm();
          }
          break;
        case 3: // Tech stack wizard
          const techWizard = (window as any).currentTechStackWizard;
          if (techWizard && techWizard.handleFinalSubmit) {
            techWizard.handleFinalSubmit();
          }
          break;
        case 4: // Questions wizard
          const questionsWizard = (window as any).currentQuestionsWizard;
          if (questionsWizard && questionsWizard.handleFinalSubmit) {
            questionsWizard.handleFinalSubmit();
          }
          break;
        case 5: // Rules wizard
          const rulesWizard = (window as any).currentRulesWizard;
          if (rulesWizard && rulesWizard.handleFinalSubmit) {
            rulesWizard.handleFinalSubmit();
          }
          break;
        case 6: // Features wizard
          const featuresWizard = (window as any)[
            `currentMiniWizard_${MiniWizardId.ADD_FEATURES}`
          ];
          if (featuresWizard && featuresWizard.handleComplete) {
            featuresWizard.handleComplete();
          } else {
            // Fallback to navigation
            navigate("next");
          }
          break;
        case 7: // Collections wizard
          const collectionsWizard = (window as any)[
            `currentMiniWizard_${MiniWizardId.ADD_COLLECTIONS}`
          ];
          if (collectionsWizard && collectionsWizard.handleComplete) {
            collectionsWizard.handleComplete();
          } else {
            // Fallback to navigation
            navigate("next");
          }
          break;
        case 8: // Notes wizard
          const notesWizard = (window as any)[
            `currentMiniWizard_${MiniWizardId.ADD_NOTES}`
          ];
          if (notesWizard && notesWizard.handleComplete) {
            notesWizard.handleComplete();
          } else {
            // Fallback to navigation
            navigate("next");
          }
          break;
        default:
          // For other wizards, just navigate to next
          navigate("next");
          break;
      }
    } else {
      // Regular navigation between steps - validate first for wizards that have validation
      let canProceed = true;

      switch (mainStep) {
        case 1: // Product wizard
          const productWizard = (window as any).currentProductWizard;
          if (
            productWizard &&
            productWizard.canGoNext &&
            !productWizard.canGoNext()
          ) {
            canProceed = false;
          }
          break;
        case 2: // Business stack wizard
          const businessWizard = (window as any).currentBusinessStackWizard;
          if (
            businessWizard &&
            businessWizard.canGoNext &&
            !businessWizard.canGoNext()
          ) {
            canProceed = false;
          }
          break;
        case 3: // Tech stack wizard
          const techWizard = (window as any).currentTechStackWizard;
          if (techWizard && techWizard.canGoNext && !techWizard.canGoNext()) {
            canProceed = false;
          }
          break;
        default:
          break;
      }

      if (canProceed) {
        navigate("next");
      }
      // If validation failed, don't navigate (wizard should show error message)
    }
  };

  const handleBack = () => {
    navigate("back");
  };

  const handleSkip = () => {
    const [mainStep] = globalStep;

    // Skip to next wizard (mainStep + 1, subStep 1)
    if (mainStep < TOTAL_WIZARDS - 1) {
      navigate([mainStep + 1, 1]);

      toast({
        title: "Wizard Skipped",
        description: "You can always come back to complete this wizard later.",
      });
    }
  };

  // Handle mini-wizard completion with XP reward
  const handleMiniWizardComplete = async (
    wizardId: MiniWizardId,
    _formData: Record<string, any>
  ) => {
    console.log(
      `[MainWizard] *** handleMiniWizardComplete CALLED *** for ${wizardId}`
    );

    // Use the XP reward defined for each wizard
    const xpReward = 50; // Default XP reward

    // Update completed mini-wizards if not already completed
    if (!completedMiniWizards.includes(wizardId)) {
      setCompletedMiniWizards((prev: any) => [...prev, wizardId]);

      // Award XP using the XP mutation hook
      try {
        // Map wizard IDs to the corresponding action IDs in points-schedule.ts
        let actionId = "";

        // Map each wizard to its corresponding XP action
        switch (wizardId) {
          case MiniWizardId.CREATE_PRODUCT:
            actionId = "create_product";
            break;
          case MiniWizardId.CREATE_BUSINESS_STACK:
          case MiniWizardId.CREATE_TECHNICAL_STACK:
          case MiniWizardId.CREATE_360_QUESTIONS_STACK:
          case MiniWizardId.CREATE_RULES_STACK:
            actionId = "create_stack";
            break;
          case MiniWizardId.ADD_FEATURES:
            actionId = "create_feature";
            break;
          case MiniWizardId.ADD_COLLECTIONS:
            actionId = "create_collection";
            break;
          case MiniWizardId.ADD_NOTES:
            actionId = "create_note";
            break;
          default:
            actionId = "create_product"; // Default fallback
        }

        console.log(`[MainWizard] Awarding XP for action::: ${actionId}`);
        // Award XP in background - non-blocking
        xpMutation.mutate(actionId);
      } catch (error) {
        console.error("[MainWizard] Error triggering XP mutation:", error);
      }
    }

    // Show celebration
    console.log(
      `[MainWizard] FORCING celebration to show with ${xpReward} XP for ${wizardId}`
    );
    setCompletedWizardId(wizardId); // Track which wizard completed
    setShowCelebration(false);
    setCelebrationXp(xpReward);
    setShowCelebration(true);

    // Also use a timeout as backup
    setTimeout(() => {
      console.log(
        "[MainWizard] Backup timeout: Setting showCelebration to true"
      );
      setShowCelebration(true);
    }, 10);
  };

  // Handle celebration completion
  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setCompletedWizardId(null); // Reset completed wizard ID
    navigate("next"); // Use navigate directly to avoid re-triggering form submission
  };

  // Render the appropriate wizard based on current global step
  const renderWizardContent = () => {
    // HIGHEST PRIORITY: Show celebration if it's active
    if (showCelebration && completedWizardId) {
      console.log("[MainWizard] Rendering celebration component");
      return (
        <WizardCelebration
          miniWizardId={completedWizardId} // Use the actual completed wizard ID
          xpEarned={celebrationXp}
          onComplete={handleCelebrationComplete}
        />
      );
    }

    if (isLoading) {
      return (
        <div
          data-testid="wizard-loading"
          className="flex items-center justify-center h-64"
        >
          Loading...
        </div>
      );
    }

    const [mainStep, subStep] = globalStep;

    // Introduction (mainStep 0)
    if (mainStep === 0) {
      return (
        <WizardIntroduction
          onNext={handleNext}
          onBack={handleBack}
          currentStep={subStep - 1} // Convert to 0-based for Introduction component
          onStepChange={(step) => navigate([0, step + 1])} // Convert back to 1-based
        />
      );
    }

    // Completion (mainStep 9)
    if (mainStep === 9) {
      return <WizardCompletion totalXp={userProfile?.xp || 0} />;
    }

    // Mini-wizards (mainStep 1-8)
    switch (mainStep) {
      case 1: // Product wizard
        return (
          <CreateProductWizard
            onBack={handleBack}
            onComplete={(formData) =>
              handleMiniWizardComplete(MiniWizardId.CREATE_PRODUCT, formData)
            }
            currentStep={subStep}
            onStepChange={(step) => navigate([1, step])}
          />
        );
      case 2: // Business stack wizard
        return (
          <CreateBusinessStackWizard
            onBack={handleBack}
            onComplete={(formData) =>
              handleMiniWizardComplete(
                MiniWizardId.CREATE_BUSINESS_STACK,
                formData
              )
            }
            currentStep={subStep}
            onStepChange={(step) => navigate([2, step])}
          />
        );
      case 3: // Tech stack wizard (our new 10-step wizard)
        return (
          <CreateTechnicalStackWizard
            onComplete={(formData) =>
              handleMiniWizardComplete(
                MiniWizardId.CREATE_TECHNICAL_STACK,
                formData
              )
            }
          />
        );
      case 4: // Questions wizard
        return (
          <Create360QuestionsStackWizard
            _onBack={handleBack}
            onComplete={(formData) =>
              handleMiniWizardComplete(
                MiniWizardId.CREATE_360_QUESTIONS_STACK,
                formData
              )
            }
          />
        );
      case 5: // Rules wizard
        return (
          <CreateRulesStackWizard
            onBack={handleBack}
            onComplete={(formData) =>
              handleMiniWizardComplete(
                MiniWizardId.CREATE_RULES_STACK,
                formData
              )
            }
          />
        );
      case 6: // Features wizard
        return (
          <AddFeaturesWizard
            onBack={handleBack}
            onComplete={(formData) =>
              handleMiniWizardComplete(MiniWizardId.ADD_FEATURES, formData)
            }
          />
        );
      case 7: // Collections wizard
        return (
          <AddCollectionsWizard
            onBack={handleBack}
            onComplete={(formData) =>
              handleMiniWizardComplete(MiniWizardId.ADD_COLLECTIONS, formData)
            }
          />
        );
      case 8: // Notes wizard
        return (
          <AddNotesWizard
            onBack={handleBack}
            onComplete={(formData) =>
              handleMiniWizardComplete(MiniWizardId.ADD_NOTES, formData)
            }
          />
        );
      default:
        return <div>Unknown wizard step</div>;
    }
  };

  // Get button text based on current step
  const getNextButtonText = () => {
    const [mainStep, subStep] = globalStep;
    const currentWizard =
      WIZARD_STEP_DEFINITIONS[mainStep as keyof typeof WIZARD_STEP_DEFINITIONS];

    if (mainStep === 0) {
      // Introduction
      return subStep === 4 ? "Start Creating" : "Next";
    }

    if (mainStep === 9) {
      // Completion
      return "Finish";
    }

    // Mini-wizards
    if (subStep === currentWizard.totalSteps) {
      // Last step of a wizard - check if we should show "Create" or "Update"
      switch (mainStep) {
        case 1:
          return selectedProduct && selectedProduct.id
            ? "Update Product"
            : "Create Product";
        case 2:
          return selectedBusinessStack && selectedBusinessStack.id
            ? "Update Business Stack"
            : "Create Business Stack";
        case 3:
          return selectedTechStack && selectedTechStack.id
            ? "Update Tech Stack"
            : "Create Tech Stack";
        case 4:
          return "Complete Questions";
        case 5:
          return "Create Rules Stack";
        case 6:
          // Check if features already exist in wizard storage
          const wizardFeatures = localStorage.getItem("wizardFeatures");
          const hasExistingFeatures =
            wizardFeatures && JSON.parse(wizardFeatures).length > 0;
          return hasExistingFeatures ? "Update Features" : "Add Features";
        case 7:
          // Check if collections already exist in wizard storage
          const wizardCollections = localStorage.getItem("wizardCollections");
          const hasExistingCollections =
            wizardCollections && JSON.parse(wizardCollections).length > 0;

          // Check if currently uploading
          const currentMiniWizard = (window as any)[
            `currentMiniWizard_ADD_COLLECTIONS`
          ];
          if (currentMiniWizard?.isSubmitting) {
            return "Uploading Documents...";
          }

          return hasExistingCollections
            ? "Update Collections"
            : "Add Collections";
        case 8:
          return "Complete Wizard";
        default:
          return "Next";
      }
    }

    return "Next";
  };

  // Check if the next button should be disabled based on current wizard state
  const isNextButtonDisabled = () => {
    if (showCelebration) return true;

    const [mainStep, subStep] = globalStep;

    // Check wizard-specific navigation rules
    switch (mainStep) {
      case 1: // Product wizard
        const productWizard = (window as any).currentProductWizard;
        if (productWizard && productWizard.canGoNext) {
          return !productWizard.canGoNext();
        }
        break;
      case 4: // Questions wizard
        const questionsWizard = (window as any).currentQuestionsWizard;
        if (questionsWizard && questionsWizard.canGoNext) {
          return !questionsWizard.canGoNext();
        }
        break;
      default:
        break;
    }

    return false;
  };

  // Get dynamic title based on current wizard
  const getWizardTitle = () => {
    const [mainStep] = globalStep;

    // Keep "LaunchpadAI Onboarding Wizard" only for introduction
    if (mainStep === 0) {
      return "LaunchpadAI Onboarding Wizard";
    }

    // Use specific wizard titles for other steps
    const currentWizard =
      WIZARD_STEP_DEFINITIONS[mainStep as keyof typeof WIZARD_STEP_DEFINITIONS];
    return currentWizard?.title || "LaunchpadAI Onboarding Wizard";
  };

  // Determine when to show skip button
  const shouldShowSkip = () => {
    const [mainStep] = globalStep;
    // Show skip for mini-wizards (2-7) but not for product wizard (1), introduction (0), or completion (8)
    const shouldShow = mainStep >= 2 && mainStep <= 7;
    console.log(
      `[MainWizard] shouldShowSkip: mainStep=${mainStep}, shouldShow=${shouldShow}`
    );
    return shouldShow;
  };

  // Get encouragement message based on current step
  const getEncouragementMessage = () => {
    const [mainStep] = globalStep;

    if (mainStep === 9) {
      return "Incredible! You've completed everything!";
    }

    return "You're doing great! Keep going!";
  };

  if (userProfile) {
    return (
      <WizardLayout
        title={getWizardTitle()}
        totalXp={userProfile.xp}
        progress={wizardInfo.progress.percentage}
        currentStep={wizardInfo.progress.current}
        totalSteps={wizardInfo.progress.total}
        onBack={navigation.canGoBack ? handleBack : undefined}
        onNext={handleNext}
        onSkip={handleSkip}
        isBackDisabled={!navigation.canGoBack}
        isNextDisabled={isNextButtonDisabled()}
        showNavigation={!showCelebration}
        showSkip={shouldShowSkip()}
        nextButtonText={getNextButtonText()}
        encouragementMessage={getEncouragementMessage()}
      >
        {renderWizardContent()}
      </WizardLayout>
    );
  }
}
