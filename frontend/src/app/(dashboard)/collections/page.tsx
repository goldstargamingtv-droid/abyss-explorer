"use client";

import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CollectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize your documents into folders and collections
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed">
        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No collections yet</h3>
        <p className="text-muted-foreground text-center max-w-sm mt-1">
          Create collections to organize your documents by project, topic, or any way you like.
        </p>
        <Button className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Create your first collection
        </Button>
      </div>
    </div>
  );
}
