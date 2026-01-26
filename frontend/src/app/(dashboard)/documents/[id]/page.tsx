"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Trash2, Pin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";

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

export default function DocumentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await api.get(`/documents/${documentId}`);
        setDocument(response.data);
        setTitle(response.data.title);
        setContent(response.data.content);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Document not found.",
        });
        router.push("/documents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please enter a title for your document.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.patch(`/documents/${documentId}`, {
        title: title.trim(),
        content: content,
      });

      setDocument(response.data);
      setHasChanges(false);

      toast({
        title: "Saved",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await api.delete(`/documents/${documentId}`);
      toast({
        title: "Deleted",
        description: "Document has been deleted.",
      });
      router.push("/documents");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document.",
      });
    }
  };

  const handlePin = async () => {
    if (!document) return;

    try {
      const response = await api.post(
        `/documents/${documentId}/pin?pinned=${!document.is_pinned}`
      );
      setDocument(response.data);
      toast({
        title: document.is_pinned ? "Unpinned" : "Pinned",
        description: document.is_pinned
          ? "Document has been unpinned."
          : "Document has been pinned.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document.",
      });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/documents")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Last saved: {new Date(document.updated_at).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePin}
            title={document.is_pinned ? "Unpin" : "Pin"}
          >
            <Pin
              className={`h-4 w-4 ${document.is_pinned ? "fill-primary text-primary" : ""}`}
            />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : hasChanges ? "Save" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-4">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Document title..."
          className="text-2xl font-bold border-none px-0 focus-visible:ring-0 bg-transparent"
        />

        <TipTapEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}
