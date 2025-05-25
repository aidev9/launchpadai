"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { currentUserAtom } from "../users-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Shield,
  CreditCard,
  Send,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserById } from "../actions/users";
import { getUserAllData } from "../actions/user-data";
import { UserProfile } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { SendEmailDialog } from "../components/send-email-dialog";
import { EditUserForm } from "../components/edit-user-form";
import { updateUser } from "../actions/update-user";
import { formatTimestamp, getCurrentUnixTimestamp } from "@/utils/constants";

export default function UserDetailPage() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const [userData, setUserData] = useState<UserProfile | null>(currentUser);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [userPrompts, setUserPrompts] = useState<any[]>([]);
  const [userTechStacks, setUserTechStacks] = useState<any[]>([]);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Redirect to users list if no user is selected
  useEffect(() => {
    if (!currentUser) {
      router.push("/admin/users");
    }
  }, [currentUser, router]);

  // Load user data
  useEffect(() => {
    async function loadUserDetails() {
      if (currentUser?.uid) {
        setLoading(true);
        try {
          // Load basic user data
          const userResult = await getUserById(currentUser.uid);
          if (userResult.success) {
            setUserData(userResult.user || null);
          } else {
            toast({
              title: "Error",
              description: userResult.error || "Failed to load user details",
              variant: "destructive",
            });
          }

          // Load additional user data
          const allData = await getUserAllData(currentUser.uid);
          if (allData.success) {
            setUserProducts(allData.products || []);
            setUserPrompts(allData.prompts || []);
            setUserTechStacks(allData.techStacks || []);
            setUserSubscription(allData.subscription);
          } else {
            toast({
              title: "Error",
              description: "Failed to load some user data",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to load user details:", error);
          toast({
            title: "Error",
            description: "Failed to load user details",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    }

    loadUserDetails();
  }, [currentUser, toast]);

  // Handle user update
  const handleUpdateUser = async (values: any) => {
    if (!userData?.uid) return;

    try {
      const result = await updateUser(userData.uid, values);

      if (result.success) {
        // Refresh user data
        const userResult = await getUserById(userData.uid);
        if (userResult.success) {
          setUserData(userResult.user || null);
        }

        toast({
          title: "User updated",
          description: "User profile has been updated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // If we're redirecting or loading, show minimal content
  if (!userData || loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </Main>
    );
  }

  // Format the date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = userData.displayName || "";
    if (!displayName) return "U";

    // Get first letter of each word
    return displayName
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Main>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          {
            label: userData.displayName || userData.email || "User Details",
            isCurrentPage: true,
          },
        ]}
        className="mb-4"
      />

      {/* User Profile Card - All Attributes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Complete user profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                User ID
              </h3>
              <p className="text-sm font-mono">{userData.uid}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Display Name
              </h3>
              <p>{userData.displayName || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Email
              </h3>
              <p>{userData.email || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Email Verified
              </h3>
              <p>{userData.isEmailVerified ? "Yes" : "No"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                User Type
              </h3>
              <p>{userData.userType || "user"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Subscription
              </h3>
              <p>{userData.subscription || "free"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                XP Points
              </h3>
              <p>{userData.xp || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Level
              </h3>
              <p>{userData.level || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Created At
              </h3>
              <p>
                {formatTimestamp(
                  userData.createdAt || getCurrentUnixTimestamp()
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Completed Onboarding
              </h3>
              <p>{userData.hasCompletedOnboarding ? "Yes" : "No"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Answered Timeline Question
              </h3>
              <p>{userData.hasAnsweredTimelineQuestion ? "Yes" : "No"}</p>
            </div>
            {userData.photoURL && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Photo URL
                </h3>
                <p className="text-sm font-mono break-all">
                  {userData.photoURL}
                </p>
              </div>
            )}
          </div>
          {userData.bio && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Bio
              </h3>
              <p className="whitespace-pre-wrap">{userData.bio}</p>
            </div>
          )}
          {userData.urls && userData.urls.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                URLs
              </h3>
              <ul className="list-disc pl-5">
                {userData.urls.map((url, index) => (
                  <li key={index} className="text-sm">
                    <a
                      href={url.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {url.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {userData.completedQuests && userData.completedQuests.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Completed Quests
              </h3>
              <div className="flex flex-wrap gap-1">
                {userData.completedQuests.map((quest, index) => (
                  <Badge key={index} variant="outline">
                    {quest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/users")}
          className="mb-2 sm:mb-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm">
            Delete User
          </Button>
          <Button size="sm" onClick={() => setEditUserOpen(true)}>
            Edit User
          </Button>
        </div>
      </div>

      {/* User profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User info card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              {userData.photoURL ? (
                <AvatarImage
                  src={userData.photoURL}
                  alt={userData.displayName || ""}
                />
              ) : null}
              <AvatarFallback className="text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {userData.displayName || userData.email || "User"}
              </CardTitle>
              <CardDescription>
                {userData.userType && (
                  <Badge variant="outline" className="mt-1">
                    {userData.userType}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                {userData.email || "No email"}
              </div>

              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                ID: {userData.uid}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Account</h3>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  Created
                </div>
                <span>
                  {formatTimestamp(
                    userData.createdAt || getCurrentUnixTimestamp()
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                  Verified
                </div>
                <span>{userData.isEmailVerified ? "Yes" : "No"}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  Subscription
                </div>
                <Badge
                  variant={
                    userData.subscription === "accelerator"
                      ? "default"
                      : "outline"
                  }
                >
                  {userData.subscription || "Free"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User details tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="stacks">Stacks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Stats</CardTitle>
                  <CardDescription>
                    Summary of user activity and contributions
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">
                      XP Points
                    </span>
                    <span className="text-2xl font-bold">
                      {userData.xp || 0}
                    </span>
                  </div>
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">Level</span>
                    <span className="text-2xl font-bold">
                      {userData.level || 0}
                    </span>
                  </div>
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">
                      Onboarding
                    </span>
                    <span className="text-2xl font-bold">
                      {userData.hasCompletedOnboarding
                        ? "Completed"
                        : "Incomplete"}
                    </span>
                  </div>
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">
                      Timeline Question
                    </span>
                    <span className="text-2xl font-bold">
                      {userData.hasAnsweredTimelineQuestion
                        ? "Answered"
                        : "Unanswered"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {userData.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{userData.bio}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>
                    Current subscription plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userSubscription ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Plan Type
                          </h3>
                          <p className="text-lg font-semibold">
                            {typeof userSubscription.planType === "object"
                              ? JSON.stringify(userSubscription.planType)
                              : userSubscription.planType || "N/A"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Billing Cycle
                          </h3>
                          <p className="text-lg font-semibold">
                            {typeof userSubscription.billingCycle === "object"
                              ? JSON.stringify(userSubscription.billingCycle)
                              : userSubscription.billingCycle || "N/A"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Price
                          </h3>
                          <p className="text-lg font-semibold">
                            $
                            {typeof userSubscription.price === "object"
                              ? JSON.stringify(userSubscription.price)
                              : userSubscription.price || "0"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Status
                          </h3>
                          <Badge
                            variant={
                              userSubscription.active ? "default" : "outline"
                            }
                          >
                            {userSubscription.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Stripe Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Customer ID
                            </p>
                            <p className="text-sm font-mono">
                              {typeof userSubscription.stripeCustomerId ===
                              "object"
                                ? JSON.stringify(
                                    userSubscription.stripeCustomerId
                                  )
                                : userSubscription.stripeCustomerId || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Subscription ID
                            </p>
                            <p className="text-sm font-mono">
                              {typeof userSubscription.stripeSubscriptionId ===
                              "object"
                                ? JSON.stringify(
                                    userSubscription.stripeSubscriptionId
                                  )
                                : userSubscription.stripeSubscriptionId ||
                                  "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No subscription data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>
                      Products created by this user
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{userProducts.length}</Badge>
                </CardHeader>
                <CardContent>
                  {userProducts.length > 0 ? (
                    <div className="space-y-4">
                      {userProducts.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No products data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Prompts</CardTitle>
                    <CardDescription>
                      Prompts created by this user
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{userPrompts.length}</Badge>
                </CardHeader>
                <CardContent>
                  {userPrompts.length > 0 ? (
                    <div className="space-y-4">
                      {userPrompts.map((prompt) => (
                        <div key={prompt.id} className="border rounded-lg p-4">
                          <h3 className="font-medium">{prompt.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {prompt.body.substring(0, 100)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No prompts data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stacks" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Tech Stacks</CardTitle>
                    <CardDescription>
                      Tech stacks created by this user
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{userTechStacks.length}</Badge>
                </CardHeader>
                <CardContent>
                  {userTechStacks.length > 0 ? (
                    <div className="space-y-4">
                      {userTechStacks.map((stack) => (
                        <div key={stack.id} className="border rounded-lg p-4">
                          <h3 className="font-medium">{stack.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stack.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {stack.tags?.map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No tech stacks data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Admin actions */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Admin Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setSendEmailOpen(true)}
            className="flex items-center"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          {/* Other admin actions */}
        </div>
      </div>

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
        userEmail={userData.email || ""}
      />

      {/* Edit User Form */}
      {userData && (
        <EditUserForm
          open={editUserOpen}
          onOpenChange={setEditUserOpen}
          user={userData}
          onSave={handleUpdateUser}
        />
      )}
    </Main>
  );
}
