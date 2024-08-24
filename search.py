from fuzzywuzzy import fuzz
from collections import defaultdict
import re
from models import db, Subcategory, Category


class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.doc_ids = set()


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word, doc_id):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
            node.doc_ids.add(doc_id)
        node.is_end = True

    def search_prefix(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return set()
            node = node.children[char]
        return node.doc_ids


class SearchIndex:
    def __init__(self):
        self.inverted_index = defaultdict(list)
        self.documents = []
        self.trie = Trie()

    def add_document(self, doc):
        doc_id = len(self.documents)
        self.documents.append(
            {
                "id": doc.id,
                "name": doc.name,
                "document_type": doc.document_type,
                "identification_rules": doc.identification_rules,
                "supporting_information": doc.supporting_information,
                "category_id": doc.category_id,
            }
        )

        for field in [
            "name",
            "document_type",
            "identification_rules",
            "supporting_information",
        ]:
            tokens = self.tokenize(getattr(doc, field, ""))
            for token in tokens:
                self.inverted_index[token].append((doc_id, field))
                self.trie.insert(token, doc_id)

    def tokenize(self, text):
        return re.findall(r"\w+", str(text).lower())

    def search(self, query):
        query = query.lower()
        exact_matches = defaultdict(float)
        substring_matches = defaultdict(float)
        partial_matches = defaultdict(float)

        query_tokens = self.tokenize(query)

        for doc_id, doc in enumerate(self.documents):
            for field in [
                "name",
                "document_type",
                "identification_rules",
                "supporting_information",
            ]:
                field_value = str(doc.get(field, "")).lower()
                field_tokens = self.tokenize(field_value)

                # Exact match
                if query in field_tokens:
                    exact_matches[doc_id] += self.get_field_weight(field) * 3

                # Substring match
                elif query in field_value:
                    substring_matches[doc_id] += self.get_field_weight(field) * 2

                # Partial word match
                elif any(query in token for token in field_tokens):
                    partial_matches[doc_id] += self.get_field_weight(field)

        # Combine all matches
        all_matches = defaultdict(float)
        for matches in [exact_matches, substring_matches, partial_matches]:
            for doc_id, score in matches.items():
                all_matches[doc_id] += score

        return sorted(all_matches.items(), key=lambda x: x[1], reverse=True)

    def get_field_weight(self, field):
        weights = {
            "document_type": 3,
            "identification_rules": 3,
            "name": 1.5,
            "supporting_information": 1,
        }
        return weights.get(field, 1)


search_index = SearchIndex()


def initialize_search_index(subcategories):
    for subcategory in subcategories:
        search_index.add_document(subcategory)


def search_data(query):
    results = search_index.search(query)
    subcategory_ids = [search_index.documents[doc_id]["id"] for doc_id, _ in results]

    # Fetch fresh Subcategory objects from the database
    subcategories = Subcategory.query.filter(Subcategory.id.in_(subcategory_ids)).all()
    subcategories_dict = {s.id: s for s in subcategories}

    return [
        {
            "main_folder": subcategories_dict[
                search_index.documents[doc_id]["id"]
            ].category.name,
            "sub_folder": subcategories_dict[search_index.documents[doc_id]["id"]].name,
            "document_type": subcategories_dict[
                search_index.documents[doc_id]["id"]
            ].document_type,
            "document_type_identification_rules": subcategories_dict[
                search_index.documents[doc_id]["id"]
            ].identification_rules,
            "supporting_information": subcategories_dict[
                search_index.documents[doc_id]["id"]
            ].supporting_information,
            "match_type": "Exact Match" if score > 5 else "Partial Match",
            "score": score,
        }
        for doc_id, score in results
        if search_index.documents[doc_id]["id"] in subcategories_dict
    ]
