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
  acronym: string;
  fullForm: string;
}

export interface SearchResponse {
  exact: boolean;
  message: string;
  matches: SearchResult[];
  corrected_query?: string | null;
}