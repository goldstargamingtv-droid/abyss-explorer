"use client";

import { useState } from "react";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Find documents using keyword and semantic search
        </p>
      </div>

      {/* Search input */}
      <div className="flex gap-4 max-w-2xl">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your knowledge base..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
        <Button size="lg" className="h-12">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Search
        </Button>
      </div>

      {/* Placeholder */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <SearchIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardHeader className="text-center p-0">
            <CardTitle className="text-xl">Hybrid Search</CardTitle>
            <CardDescription className="max-w-sm">
              Coming in Phase 4! Combine keyword search with AI-powered semantic
              search to find exactly what you&apos;re looking for.
            </CardDescription>
          </CardHeader>
        </CardContent>
      </Card>
    </div>
  );
}
