"use client";

import { Upload, FileText, Link, Bookmark, Rss } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Content</h1>
        <p className="text-muted-foreground">
          Bring your knowledge from various sources into your vault
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">File Upload</CardTitle>
                <CardDescription>
                  Upload Markdown, PDF, TXT, or image files
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Import from URL</CardTitle>
                <CardDescription>
                  Save articles and web pages to your vault
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Link className="h-4 w-4 mr-2" />
              Enter URL
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Browser Bookmarks</CardTitle>
                <CardDescription>
                  Import bookmarks from Chrome, Firefox, or Safari
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Upload Bookmarks File
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Rss className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">RSS Feeds</CardTitle>
                <CardDescription>
                  Subscribe to blogs and news sources
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drag & Drop Zone</CardTitle>
          <CardDescription>
            Drop files or folders here to import them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg border-2 border-dashed hover:border-primary transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports: .md, .txt, .pdf, .epub, .png, .jpg, .html
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
