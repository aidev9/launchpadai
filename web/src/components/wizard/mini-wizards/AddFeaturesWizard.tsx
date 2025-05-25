import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import MiniWizardBase, { MiniWizardProps } from "./MiniWizardBase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { featuresAtom, productAtom, Feature } from "@/lib/store/product-store";
import { Badge } from "@/components/ui/badge";
import { X, PlusCircle, Save, Edit, Trash2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FirebaseFeatures from "@/lib/firebase/client/FirebaseFeatures";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { atomWithStorage } from "jotai/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form schema
const featureSchema = z.object({
  name: z.string().min(2, {
    message: "Feature name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Feature description must be at least 10 characters.",
  }),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["Active", "Inactive", "Under Development", "Draft"]),
  tags: z.array(z.string()),
  userStories: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  dependencies: z.array(z.string()),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

// Persistent wizard features atom
const wizardFeaturesAtom = atomWithStorage<Feature[]>("wizardFeatures", []);

export default function AddFeaturesWizard({
  onBack,
  onComplete,
}: Omit<
  MiniWizardProps,
  "miniWizardId" | "title" | "description" | "xpReward"
>) {
  const [product] = useAtom(productAtom);
  const [features, setFeatures] = useAtom(featuresAtom);
  const [wizardFeatures, setWizardFeatures] = useAtom(wizardFeaturesAtom);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number | null>(
    null
  );
  const { toast } = useToast();

  // Firebase client instance
  const [firebaseFeatures] = useState(() => new FirebaseFeatures());

  // State for new items
  const [newUserStory, setNewUserStory] = useState("");
  const [newAcceptanceCriteria, setNewAcceptanceCriteria] = useState("");
  const [newDependency, setNewDependency] = useState("");

  // Initialize form with default values
  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      status: "Draft",
      tags: [],
      userStories: [],
      acceptanceCriteria: [],
      dependencies: [],
    },
    mode: "onChange",
  });

  // Monitor form validity
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsFormValid(form.formState.isValid);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Map wizard status values to main schema status values
  const mapWizardStatusToMainSchema = (
    wizardStatus: string
  ): "Active" | "Inactive" | "Under Development" | "Draft" => {
    const statusMap: Record<
      string,
      "Active" | "Inactive" | "Under Development" | "Draft"
    > = {
      planned: "Draft",
      "in-progress": "Under Development",
      completed: "Active",
      Active: "Active",
      Inactive: "Inactive",
      "Under Development": "Under Development",
      Draft: "Draft",
    };
    return statusMap[wizardStatus] || "Draft";
  };

  // Persist features to Firebase
  const persistFeaturesToFirebase = async () => {
    if (!product?.id) {
      console.log(
        "[AddFeaturesWizard] No product ID available, skipping Firebase persistence"
      );
      return true;
    }

    if (wizardFeatures.length === 0) {
      console.log(
        "[AddFeaturesWizard] No features to persist, skipping Firebase persistence"
      );
      return true;
    }

    try {
      console.log(
        "[AddFeaturesWizard] Persisting features to Firebase:",
        wizardFeatures
      );

      // Convert features to the format expected by Firebase without checking for duplicates
      // Since features are stored in wizard state, we'll let Firebase handle unique constraints
      const featuresToCreate = wizardFeatures;

      if (featuresToCreate.length === 0) {
        console.log(
          "[AddFeaturesWizard] All features already exist in Firebase"
        );
        toast({
          title: "Features Already Exist",
          description: "All features have already been saved to Firebase",
        });
        return true;
      }

      // Convert features to the format expected by Firebase
      const formattedFeatures = featuresToCreate.map((feature) => ({
        name: feature.name,
        description: feature.description,
        status: mapWizardStatusToMainSchema(feature.status),
        tags: feature.tags || [],
        productId: product.id!,
        priority: feature.priority,
        userStories: feature.userStories || [],
        acceptanceCriteria: feature.acceptanceCriteria || [],
        dependencies: feature.dependencies || [],
      }));

      // Use batch create for new features only
      const success = await firebaseFeatures.createFeatures(formattedFeatures);

      if (success) {
        console.log(
          "[AddFeaturesWizard] Successfully persisted features to Firebase"
        );
        toast({
          title: "Features Saved",
          description: `Successfully saved ${featuresToCreate.length} new features to Firebase`,
        });
        return true;
      } else {
        console.error(
          "[AddFeaturesWizard] Failed to persist features to Firebase"
        );
        toast({
          title: "Partial Success",
          description:
            "Features were added to wizard but may not have been saved to database",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error(
        "[AddFeaturesWizard] Error persisting features to Firebase:",
        error
      );
      toast({
        title: "Warning",
        description:
          "Features were added to wizard but may not have been saved to database",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle wizard completion
  const handleWizardComplete = async (formData: Record<string, any>) => {
    console.log("[AddFeaturesWizard] Wizard completion triggered");

    // Persist features to Firebase
    await persistFeaturesToFirebase();

    // Update the features atom with the data from wizard features
    const atomFeatures: Feature[] = wizardFeatures.map((wf) => ({
      ...wf,
      id: wf.id || `temp-${Date.now()}-${Math.random()}`,
      userId: "temp",
      createdAt: wf.createdAt || getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    }));
    setFeatures(atomFeatures);

    // Call the parent completion handler
    if (onComplete) {
      onComplete(formData);
    }
  };

  // Set form values when editing a feature
  const editFeature = (index: number) => {
    const feature = wizardFeatures[index];

    // Reset form with the feature's values
    form.reset({
      name: feature.name,
      description: feature.description,
      priority: feature.priority || "medium",
      status: feature.status as any,
      tags: feature.tags || [],
      userStories: feature.userStories || [],
      acceptanceCriteria: feature.acceptanceCriteria || [],
      dependencies: feature.dependencies || [],
    });

    setCurrentFeatureIndex(index);
    setEditMode(true);
  };

  // Delete a feature
  const deleteFeature = (index: number) => {
    const updatedFeatures = [...wizardFeatures];
    updatedFeatures.splice(index, 1);
    setWizardFeatures(updatedFeatures);
  };

  // Generic function to add an item to an array field
  const addItem = (
    fieldName: "userStories" | "acceptanceCriteria" | "dependencies",
    newItem: string,
    setNewItem: (value: string) => void
  ) => {
    if (newItem.trim() === "") return;

    console.log(`[AddFeaturesWizard] Adding ${fieldName} item: ${newItem}`);
    const currentItems = form.getValues(fieldName) || [];
    form.setValue(fieldName, [...currentItems, newItem]);
    setNewItem("");
  };

  // Generic function to remove an item from an array field
  const removeItem = (
    fieldName: "userStories" | "acceptanceCriteria" | "dependencies",
    index: number
  ) => {
    console.log(
      `[AddFeaturesWizard] Removing ${fieldName} item at index ${index}`
    );
    const currentItems = form.getValues(fieldName) || [];
    const updatedItems = [...currentItems];
    updatedItems.splice(index, 1);
    form.setValue(fieldName, updatedItems);
  };

  // Cancel editing
  const cancelEdit = () => {
    form.reset({
      name: "",
      description: "",
      priority: "medium",
      status: "Draft",
      tags: [],
      userStories: [],
      acceptanceCriteria: [],
      dependencies: [],
    });

    setCurrentFeatureIndex(null);
    setEditMode(false);
  };

  // Add or update feature
  function onSubmit(values: FeatureFormValues) {
    console.log("[AddFeaturesWizard] Submitting feature form:", values);

    if (!product?.id) {
      toast({
        title: "Error",
        description: "Product is required to create features",
        variant: "destructive",
      });
      return;
    }

    const feature: Feature = {
      name: values.name,
      description: values.description,
      status: values.status as any,
      tags: values.tags || [],
      productId: product.id,
      priority: values.priority,
      userStories: values.userStories,
      acceptanceCriteria: values.acceptanceCriteria,
      dependencies: values.dependencies,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    };

    if (editMode && currentFeatureIndex !== null) {
      // Update existing feature
      const updatedFeatures = [...wizardFeatures];
      updatedFeatures[currentFeatureIndex] = {
        ...updatedFeatures[currentFeatureIndex],
        ...feature,
        updatedAt: getCurrentUnixTimestamp(),
      };

      setWizardFeatures(updatedFeatures);
      cancelEdit();
    } else {
      // Add new feature
      setWizardFeatures([...wizardFeatures, feature]);
      form.reset({
        name: "",
        description: "",
        priority: "medium",
        status: "Draft",
        tags: [],
        userStories: [],
        acceptanceCriteria: [],
        dependencies: [],
      });
    }
  }

  // Helper function to get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Under Development":
        return "bg-purple-100 text-purple-800";
      case "Draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <MiniWizardBase
      miniWizardId={MiniWizardId.ADD_FEATURES}
      title="Add Features"
      description="Define the features of your product to help AI understand its capabilities and scope."
      xpReward={50}
      onBack={onBack}
      onComplete={handleWizardComplete}
    >
      <div className="space-y-6">
        {/* Information alert */}
        {wizardFeatures.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {wizardFeatures.length} feature
              {wizardFeatures.length !== 1 ? "s" : ""} ready.
              {wizardFeatures.length === 1
                ? "This feature will be saved when you complete this step."
                : "These features will be saved when you complete this step."}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 border p-4 rounded-md"
          >
            <h3 className="text-lg font-medium">
              {editMode ? "Edit Feature" : "Add New Feature"}
            </h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter feature name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, concise name for the feature
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the feature in detail"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of what the feature does
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Under Development">
                          Under Development
                        </SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tags separated by commas"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag.length > 0);
                        field.onChange(tags);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Tags to categorize and organize features
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userStories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Stories (Optional)</FormLabel>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a user story"
                      value={newUserStory}
                      onChange={(e) => setNewUserStory(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        addItem("userStories", newUserStory, setNewUserStory)
                      }
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value?.map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 py-1 px-3"
                      >
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem("userStories", index)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    User stories that describe the feature from a user's
                    perspective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptanceCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acceptance Criteria (Optional)</FormLabel>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add acceptance criteria"
                      value={newAcceptanceCriteria}
                      onChange={(e) => setNewAcceptanceCriteria(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        addItem(
                          "acceptanceCriteria",
                          newAcceptanceCriteria,
                          setNewAcceptanceCriteria
                        )
                      }
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value?.map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 py-1 px-3"
                      >
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            removeItem("acceptanceCriteria", index)
                          }
                        />
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    Criteria that must be met for the feature to be considered
                    complete
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dependencies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependencies (Optional)</FormLabel>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a dependency"
                      value={newDependency}
                      onChange={(e) => setNewDependency(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        addItem("dependencies", newDependency, setNewDependency)
                      }
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value?.map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 py-1 px-3"
                      >
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem("dependencies", index)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    Other features or components this feature depends on
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              {editMode && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!isFormValid}>
                {editMode ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Feature
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Feature
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Features ({wizardFeatures.length})
          </h3>

          {wizardFeatures.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">
                No features added yet. Add your first feature above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {wizardFeatures.map((feature, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md">{feature.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editFeature(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFeature(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      {feature.priority && (
                        <Badge className={getPriorityColor(feature.priority)}>
                          {feature.priority.charAt(0).toUpperCase() +
                            feature.priority.slice(1)}{" "}
                          Priority
                        </Badge>
                      )}
                      <Badge className={getStatusColor(feature.status)}>
                        {feature.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>

                    {feature.tags && feature.tags.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-semibold text-gray-500">
                          Tags:
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {feature.tags.map((tag, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {feature.userStories && feature.userStories.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-semibold text-gray-500">
                          User Stories:
                        </h4>
                        <ul className="list-disc list-inside text-xs">
                          {feature.userStories.map((story, i) => (
                            <li key={i}>{story}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MiniWizardBase>
  );
}
