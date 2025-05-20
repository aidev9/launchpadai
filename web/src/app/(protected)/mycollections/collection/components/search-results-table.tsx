"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DocumentChunkSearchResult } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Document } from "@/lib/firebase/schema";

interface SearchResultsTableProps {
  results: DocumentChunkSearchResult[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onViewDocument?: (document: Document) => void;
}

export function SearchResultsTable({
  results,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: SearchResultsTableProps) {
  // Function to truncate text if it's too long
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Function to highlight keywords in text
  const highlightMatches = (text: string, similarity: number) => {
    // Format similarity as percentage
    const similarityPercentage = Math.round(similarity * 100);

    return (
      <div>
        <div className="mb-1 flex items-center">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 mr-2"
          >
            {similarityPercentage}% match
          </Badge>
        </div>
        <p className="whitespace-pre-line">{truncateText(text)}</p>
      </div>
    );
  };

  // Get pagination range
  const getPaginationRange = () => {
    const range = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);

      // Calculate start and end of the range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust start and end to ensure we show maxPagesToShow - 2 pages (excluding first and last)
      if (end - start + 1 < maxPagesToShow - 2) {
        if (start === 2) {
          end = Math.min(totalPages - 1, start + (maxPagesToShow - 3));
        } else if (end === totalPages - 1) {
          start = Math.max(2, end - (maxPagesToShow - 3));
        }
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        range.push("ellipsis-start");
      }

      // Add pages in range
      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        range.push("ellipsis-end");
      }

      // Always show last page
      if (totalPages > 1) {
        range.push(totalPages);
      }
    }

    return range;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-muted-foreground">Try a different search query</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table data-testid="search-results-table">
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Content Match</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={`${result.document_id}-${result.chunk_index}`}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{result.document_title}</span>
                    <span className="text-sm text-muted-foreground">
                      {result.filename}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Chunk {result.chunk_index + 1} of {result.total_chunks}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {highlightMatches(result.chunk_content, result.similarity)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                      data-testid={`download-${result.document_id}`}
                    >
                      <a
                        href={result.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                      data-testid={`view-${result.document_id}`}
                    >
                      <a
                        href={result.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                data-testid="pagination-previous"
              />
            </PaginationItem>

            {getPaginationRange().map((page, i) => {
              if (page === "ellipsis-start" || page === "ellipsis-end") {
                return (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => onPageChange(page as number)}
                    data-testid={`pagination-${page}`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                data-testid="pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
