"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";

export default function NewDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      const response = await api.post("/documents", {
        title: title.trim(),
        content: content,
        doc_type: "note",
      });

      toast({
        title: "Document created",
        description: "Your document has been saved successfully.",
      });

      // Navigate to the new document
      router.push(`/documents/${response.data.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.detail || "Failed to save document. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Document</h1>
            <p className="text-muted-foreground">
              Create a new note or document
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Editor */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium"
          />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your document..."
          />
        </div>
      </div>
    </div>
  );
}
