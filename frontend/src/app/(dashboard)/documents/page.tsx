"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Grid3X3,
  List,
  SortAsc,
  Filter,
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
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export default function DocumentsPage() {
  const router = useRouter();
  const { viewMode, setViewMode } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder for empty state
  const documents: unknown[] = [];

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
      {documents.length === 0 ? (
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
          {/* Document list will be rendered here */}
        </div>
      )}
    </div>
  );
}
