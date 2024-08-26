// types.ts

export interface SearchResult {
  main_folder: string;
  sub_folder: string;
  document_type: string;
  document_type_identification_rules: string;
  supporting_information: string;
  match_type: string;
  score: number;
}

export interface Update {
  main_folder: string;
  category: string;
  description: string;
  new: boolean;
  date: string;
}

export interface Acronym {
  id: number;
  acronym: string;
  expansion: string;
  context?: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcronymMatch {
  acronym: string;
  expansion: string;
  context?: string;
}

export interface SearchResponse {
  exact: boolean;
  message: string;
  matches: SearchResult[];
  corrected_query?: string | null;
}

export interface AcronymSuggestion {
  acronym: string;
  expansion: string;
  context?: string;
}

export interface AcronymSearchResponse {
  matches: AcronymMatch[];
}

export interface AcronymSuggestionResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}