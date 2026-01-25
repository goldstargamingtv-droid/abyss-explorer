"use client";

import { Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GraphPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground">
          Visualize connections between your documents
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Network className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardHeader className="text-center p-0">
            <CardTitle className="text-xl">Graph Visualization</CardTitle>
            <CardDescription className="max-w-sm">
              Coming in Phase 5! The knowledge graph will show connections between
              your documents based on semantic similarity, backlinks, and shared tags.
            </CardDescription>
          </CardHeader>
        </CardContent>
      </Card>
    </div>
  );
}
