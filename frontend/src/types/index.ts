// User types
export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Document types
export interface Document {
  id: string;
  user_id: string;
  title: string;
  content_raw: string | null;
  content_html: string | null;
  content_plain: string | null;
  doc_type: DocumentType;
  source_type: SourceType;
  source_url: string | null;
  metadata: Record<string, unknown>;
  importance_score: number;
  source_date: string | null;
  created_at: string;
  updated_at: string;
  last_accessed: string;
  is_archived: boolean;
  is_pinned: boolean;
  is_processed: boolean;
  tags?: Tag[];
  links?: DocumentLink[];
}

export type DocumentType =
  | "note"
  | "article"
  | "bookmark"
  | "pdf"
  | "image"
  | "email"
  | "tweet";

export type SourceType = "manual" | "upload" | "import" | "api";

// Tag types
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_auto: boolean;
  created_at: string;
}

// Link types
export interface DocumentLink {
  id: string;
  source_id: string;
  target_id: string;
  link_type: LinkType;
  similarity_score: number | null;
  context: string | null;
  is_auto: boolean;
  created_at: string;
}

export type LinkType =
  | "backlink"
  | "semantic"
  | "entity"
  | "tag_overlap"
  | "manual";

// Collection types
export interface Collection {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  icon: string;
  description: string | null;
  children?: Collection[];
  created_at: string;
  updated_at: string;
}

// Graph types
export interface GraphNode {
  id: string;
  label: string;
  type: DocumentType;
  tags: string[];
  connections: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: LinkType;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Search types
export interface SearchResult {
  document: Document;
  score: number;
  highlights: string[];
}

export interface SearchFilters {
  doc_types?: DocumentType[];
  tags?: string[];
  collections?: string[];
  date_from?: string;
  date_to?: string;
  is_archived?: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API error
export interface ApiError {
  detail: string;
  error_code?: string;
}
