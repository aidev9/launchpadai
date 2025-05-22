"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import {
  selectedCollectionAtom,
  collectionDocumentsAtom,
  selectedDocumentAtom,
} from "@/lib/store/collection-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { DocumentTable } from "./components/document-table";
import { DocumentForm } from "./components/document-form";
import { Document, DocumentStatus } from "@/lib/firebase/schema";
import { McpTab } from "./mcp-tab";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import {
  deleteDocumentAction,
  searchDocumentChunks,
  DocumentChunkSearchResult,
} from "../actions";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "./components/search-form";
import { SearchResultsTable } from "./components/search-results-table";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { clientAuth } from "@/lib/firebase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { updateDocumentStatus } from "@/lib/firebase/documents";
import FirebaseDocuments, {
  firebaseDocuments,
} from "@/lib/firebase/client/FirebaseDocuments";
import { ChatPanel } from "./components/chat-panel";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function CollectionDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedCollection] = useAtom(selectedCollectionAtom);
  const [, setSelectedDocument] = useAtom(selectedDocumentAtom);
  const [, setAllDocuments] = useAtom(collectionDocumentsAtom);
  const [activeTab, setActiveTab] = useState("general");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | undefined>(
    undefined
  );

  // Search state
  const [searchResults, setSearchResults] = useState<
    DocumentChunkSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [lastSearchQuery, setLastSearchQuery] = useState("");

  // Get current user
  const userId = clientAuth.currentUser?.uid || "";

  // Fetch documents using react-firebase-hooks
  const [documents, documentsLoading, documentsError] = useCollectionData(
    selectedCollection
      ? firebaseDocuments.getDocumentsByCollections(selectedCollection.id)
      : null,
    {
      snapshotListenOptions: {
        includeMetadataChanges: true,
      },
    }
  );

  // Redirect if no collection is selected
  useEffect(() => {
    if (!selectedCollection) {
      router.push("/mycollections");
    }
  }, [selectedCollection, router]);

  // Show delete confirmation dialog
  const showDeleteConfirmation = (document: Document) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      setIsSubmitting(true);

      // Store document info before closing dialog
      const documentId = documentToDelete.id;
      const documentTitle = documentToDelete.title;

      // Close the dialog
      setIsDeleteDialogOpen(false);

      // Perform the deletion
      const result = await deleteDocumentAction(documentId);

      if (result.success) {
        toast({
          title: "Success",
          description: `"${documentTitle}" deleted successfully`,
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete document",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
      setDocumentToDelete(null);
    }
  };

  // Handle document status update
  const handleUpdateDocumentStatus = async (
    document: Document,
    status: DocumentStatus
  ) => {
    try {
      await updateDocumentStatus(document.id, status);
      toast({
        title: "Success",
        description: `Document status updated to ${status}`,
        duration: TOAST_DEFAULT_DURATION,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    }
  };

  // Handle document creation success
  const handleDocumentCreated = (newDocument: Document) => {
    // Switch to the documents tab to show the new document
    setActiveTab("documents");
  };

  // Handle document view
  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    router.push("/mycollections/document");
  };

  // Handle document editing
  const handleEditDocument = (document: Document) => {
    setDocumentToEdit(document);
    setIsDocumentModalOpen(true);
  };

  // Handle search submission
  const handleSearch = async (query: string) => {
    if (!selectedCollection?.id) return;

    setIsSearching(true);
    setLastSearchQuery(query);

    try {
      const response = await searchDocumentChunks(
        query,
        selectedCollection.id,
        1, // Start with first page
        10 // Page size
      );

      if (response.success) {
        setSearchResults(response.results || []);
        setSearchCurrentPage(response.page || 1);
        setSearchTotalPages(response.totalPages || 1);
        setSearchTotalResults(response.totalResults || 0);
      } else {
        toast({
          title: "Error",
          description: response.error || "Search failed",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        setSearchResults([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Search failed",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search page navigation
  const handlePageChange = async (page: number) => {
    if (!selectedCollection?.id || !lastSearchQuery) return;

    setIsSearching(true);

    try {
      const response = await searchDocumentChunks(
        lastSearchQuery,
        selectedCollection.id,
        page,
        10 // Page size
      );

      if (response.success) {
        setSearchResults(response.results || []);
        setSearchCurrentPage(response.page || 1);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch results",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (!selectedCollection) {
    return (
      <Main>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">No collection selected</h2>
          <Button
            className="mt-4"
            onClick={() => router.push("/mycollections")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Button>
        </div>
      </Main>
    );
  }

  // Get status color for collection badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "indexing":
        return "bg-blue-100 text-blue-700";
      case "indexed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Render status badge
  const renderStatusBadge = () => {
    const status = selectedCollection.status;
    if (status === "indexing") {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Indexing
        </Badge>
      );
    } else if (status === "indexed") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Indexed
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          {selectedCollection.status.charAt(0).toUpperCase() +
            selectedCollection.status.slice(1)}
        </Badge>
      );
    }
  };

  if (documentsError)
    return (
      <>
        <strong>Connection error!</strong>
        <p>{documentsError.message}</p>
      </>
    );

  if (documents) {
    const typedDocuments: Document[] = (documents as Document[]) || [];
    return (
      <Main className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <Breadcrumbs
              items={[
                { label: "Collections", href: "/mycollections" },
                {
                  label: selectedCollection.title,
                  isCurrentPage: true,
                },
              ]}
            />
            <div className="mt-2 flex items-center gap-2">
              <h1 className="text-2xl font-bold">{selectedCollection.title}</h1>
              {renderStatusBadge()}
            </div>
            <p className="text-muted-foreground mt-1">
              {selectedCollection.description || "No description"}
            </p>
          </div>

          <Button
            onClick={() => setIsDocumentModalOpen(true)}
            className="ml-auto"
            data-testid="add-document-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Collection Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Status</p>
                    <div className="text-muted-foreground">
                      {renderStatusBadge()}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Phase Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCollection.phaseTags.length > 0 ? (
                        selectedCollection.phaseTags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No phase tags</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCollection.tags.length > 0 ? (
                        selectedCollection.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No tags</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Documents</p>
                    <p className="text-muted-foreground">
                      {documentsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        typedDocuments.length
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground">
                      {new Date(
                        selectedCollection.createdAt * 1000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-muted-foreground">
                      {new Date(
                        selectedCollection.updatedAt * 1000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {documentsError && (
              <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                <p>Error: {documentsError as string}</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => router.refresh()}
                >
                  Try Again
                </Button>
              </div>
            )}

            {documentsLoading ? (
              <div className="rounded-md border">
                <div className="p-8 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Loading documents...
                    </p>
                  </div>
                </div>
              </div>
            ) : typedDocuments.length === 0 ? (
              <div className="text-center py-10 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add documents to this collection to get started
                </p>
                <Button onClick={() => setIsDocumentModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Document
                </Button>
              </div>
            ) : (
              <DocumentTable
                data={typedDocuments}
                onDelete={showDeleteConfirmation}
                onStatusUpdate={handleUpdateDocumentStatus}
                onView={handleViewDocument}
                onEdit={handleEditDocument}
              />
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <SearchForm
              onSearch={handleSearch}
              isSearching={isSearching}
              disabled={!selectedCollection.id}
            />

            {searchResults.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Found {searchTotalResults} results for &quot;
                  {lastSearchQuery}&quot;
                </p>
                <SearchResultsTable
                  results={searchResults}
                  currentPage={searchCurrentPage}
                  totalPages={searchTotalPages}
                  onPageChange={handlePageChange}
                  isLoading={isSearching}
                  onViewDocument={handleViewDocument}
                />
              </div>
            )}

            {!isSearching && searchResults.length === 0 && lastSearchQuery && (
              <div className="text-center py-10 border rounded-lg mt-4">
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try a different search query
                </p>
              </div>
            )}

            {!lastSearchQuery && (
              <div className="text-center py-10 border rounded-lg mt-4">
                <h3 className="text-lg font-medium mb-2">
                  Search across documents
                </h3>
                <p className="text-muted-foreground">
                  Enter a search query to find content in your documents
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {selectedCollection.status !== "indexed" ? (
              <div className="text-center py-10 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">
                  Collection must be indexed
                </h3>
                <p className="text-muted-foreground mb-6">
                  The collection needs to be fully indexed before you can chat
                  with your documents
                </p>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {selectedCollection.status}
                </Badge>
              </div>
            ) : (
              <ChatPanel
                collection={selectedCollection}
                documents={typedDocuments}
              />
            )}
          </TabsContent>

          {/* MCP Tab */}
          <McpTab collectionId={selectedCollection.id} />
        </Tabs>

        {/* Document creation modal */}
        <DocumentForm
          isOpen={isDocumentModalOpen}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setDocumentToEdit(undefined);
          }}
          onDocumentCreated={handleDocumentCreated}
          collectionId={selectedCollection.id}
          productId={selectedCollection.productId}
          documentToEdit={documentToEdit}
          onSuccess={(updatedDocument) => {
            // Handle successful update
            toast({
              title: "Success",
              description: "Document updated successfully",
              duration: TOAST_DEFAULT_DURATION,
            });
            setDocumentToEdit(undefined);
          }}
        />

        {/* Delete confirmation dialog */}
        {documentToDelete && (
          <div
            className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 ${
              isDeleteDialogOpen ? "block" : "hidden"
            }`}
          >
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
              <p className="mb-4">
                Are you sure you want to delete &quot;{documentToDelete.title}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteDocument}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Main>
    );
  }

  return <></>;
}
