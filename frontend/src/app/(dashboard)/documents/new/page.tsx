"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

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
      // TODO: Implement document creation API call
      toast({
        title: "Document created",
        description: "Your document has been saved successfully.",
      });
      router.push("/documents");
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save document. Please try again.",
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
          <Label htmlFor="content">Content</Label>
          <div className="min-h-[400px] rounded-lg border bg-background">
            <textarea
              id="content"
              placeholder="Start writing... (Rich text editor coming in Phase 2)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[400px] p-4 bg-transparent resize-none focus:outline-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Use Markdown syntax for formatting. Full TipTap editor coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
