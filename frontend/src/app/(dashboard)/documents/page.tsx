"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Grid3X3,
  List,
  SortAsc,
  Filter,
  Pin,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export default function DocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { viewMode, setViewMode } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/documents", {
        params: {
          query: searchQuery || undefined,
        },
      });
      setDocuments(response.data.items);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter((d) => d.id !== id));
      toast({
        title: "Document deleted",
        description: "The document has been permanently deleted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document.",
      });
    }
  };

  const handlePin = async (id: string, pinned: boolean) => {
    try {
      await api.post(`/documents/${id}/pin?pinned=${!pinned}`);
      setDocuments(
        documents.map((d) =>
          d.id === id ? { ...d, is_pinned: !pinned } : d
        )
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPreview = (content: string) => {
    // Strip HTML tags and get first 150 chars
    const text = content.replace(/<[^>]*>/g, "");
    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize your knowledge base
          </p>
        </div>
        <Button onClick={() => router.push("/documents/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon">
          <SortAsc className="h-4 w-4" />
        </Button>

        <div className="flex items-center border rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-r-none",
              viewMode === "list" && "bg-muted"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-l-none",
              viewMode === "grid" && "bg-muted"
            )}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardHeader className="text-center p-0">
              <CardTitle className="text-xl">No documents yet</CardTitle>
              <CardDescription className="max-w-sm">
                Get started by creating your first document or importing existing
                content from files, bookmarks, or other sources.
              </CardDescription>
            </CardHeader>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => router.push("/documents/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
              <Button variant="outline" onClick={() => router.push("/import")}>
                Import Content
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-2"
          )}
        >
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                "cursor-pointer hover:border-primary/50 transition-colors",
                viewMode === "list" && "flex items-center"
              )}
              onClick={() => router.push(`/documents/${doc.id}`)}
            >
              <CardHeader className={cn(viewMode === "list" && "flex-1 py-3")}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {doc.is_pinned && (
                      <Pin className="h-3 w-3 text-primary fill-primary" />
                    )}
                    <CardTitle className="text-base line-clamp-1">
                      {doc.title}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePin(doc.id, doc.is_pinned);
                        }}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        {doc.is_pinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {viewMode === "grid" && (
                  <CardDescription className="line-clamp-2 mt-1">
                    {getPreview(doc.content) || "No content"}
                  </CardDescription>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{formatDate(doc.updated_at)}</span>
                  {doc.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{doc.tags.slice(0, 2).join(", ")}</span>
                    </>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
