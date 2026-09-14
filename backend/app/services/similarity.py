import ast
import re
from typing import Tuple, Dict, Any, List
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def strip_comments_and_docstrings(source: str, language: str = "python") -> str:
    """Remove comments and docstrings from source code."""
    if language == "python":
        source = re.sub(r'#.*', '', source)
        source = re.sub(r'\'\'\'[\s\S]*?\'\'\'', '', source)
        source = re.sub(r'\"\"\"[\s\S]*?\"\"\"', '', source)
    else:
        source = re.sub(r'//.*', '', source)
        source = re.sub(r'/\*[\s\S]*?\*/', '', source)
    return source


def normalize_whitespace(source: str) -> str:
    """Normalize whitespace and empty lines."""
    lines = [line.strip() for line in source.splitlines()]
    lines = [line for line in lines if line]
    return " ".join(lines)


def tokenize_code(source: str) -> List[str]:
    """Tokenize source code into programming keywords, identifiers, and symbols."""
    tokens = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*|[0-9]+|==|!=|<=|>=|\+=|-=|\*=|/=|&&|\|\||[{}()\[\],;+\-*/%<>=!]', source)
    return tokens


def compute_token_similarity(code_a: str, code_b: str, language: str = "python") -> float:
    """
    Compute token-based TF-IDF cosine similarity between two code snippets.
    Returns a score between 0.0 and 1.0.
    """
    cleaned_a = normalize_whitespace(strip_comments_and_docstrings(code_a, language))
    cleaned_b = normalize_whitespace(strip_comments_and_docstrings(code_b, language))

    if not cleaned_a and not cleaned_b:
        return 1.0
    if not cleaned_a or not cleaned_b:
        return 0.0

    try:
        vectorizer = TfidfVectorizer(tokenizer=tokenize_code, token_pattern=None, ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([cleaned_a, cleaned_b])
        cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(np.clip(cos_sim, 0.0, 1.0))
    except Exception:
        tokens_a = set(tokenize_code(cleaned_a))
        tokens_b = set(tokenize_code(cleaned_b))
        if not tokens_a and not tokens_b:
            return 1.0
        intersection = len(tokens_a.intersection(tokens_b))
        union = len(tokens_a.union(tokens_b))
        return float(intersection / union) if union > 0 else 0.0


class ASTNormalizer(ast.NodeTransformer):
    """
    Normalizes variable names, argument names, and helper functions in Python AST
    so that variable renaming does not alter structural representation.
    """
    def __init__(self):
        super().__init__()
        self.var_map: Dict[str, str] = {}
        self.var_counter: int = 0

    def get_var_alias(self, name: str) -> str:
        if name not in self.var_map:
            self.var_counter += 1
            self.var_map[name] = f"v_{self.var_counter}"
        return self.var_map[name]

    def visit_Name(self, node: ast.Name):
        builtins = {"range", "print", "len", "sum", "int", "str", "float", "dict", "list", "set", "min", "max", "enumerate", "zip", "True", "False", "None"}
        if node.id not in builtins:
            node.id = self.get_var_alias(node.id)
        return self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        node.name = self.get_var_alias(node.name)
        return self.generic_visit(node)

    def visit_arg(self, node: ast.arg):
        node.arg = self.get_var_alias(node.arg)
        return self.generic_visit(node)


def extract_ast_features(tree: ast.AST) -> List[str]:
    """
    Extract structural node sequence and grammatical transitions from AST.
    e.g., ['FunctionDef', 'For', 'Assign', 'BinOp', 'Return']
    """
    node_tokens = []
    for node in ast.walk(tree):
        node_name = type(node).__name__
        # Ignore top-level container noise
        if node_name not in ("Module", "Load", "Store", "Del", "Expr"):
            node_tokens.append(node_name)
    return node_tokens


def compute_ast_similarity(code_a: str, code_b: str) -> float:
    """
    Compute structural AST similarity between two Python snippets.
    Normalizes variable names and compares sequences of syntactic node types.
    """
    try:
        tree_a = ast.parse(code_a)
        tree_b = ast.parse(code_b)

        # Normalize variable names
        norm_a = ASTNormalizer().visit(tree_a)
        norm_b = ASTNormalizer().visit(tree_b)

        features_a = extract_ast_features(norm_a)
        features_b = extract_ast_features(norm_b)

        if not features_a and not features_b:
            return 1.0
        if not features_a or not features_b:
            return 0.0

        # Vectorize node sequences with bigrams to capture control flow
        text_a = " ".join(features_a)
        text_b = " ".join(features_b)

        vectorizer = TfidfVectorizer(ngram_range=(1, 2))
        matrix = vectorizer.fit_transform([text_a, text_b])
        sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return float(np.clip(sim, 0.0, 1.0))
    except Exception:
        return -1.0


def analyze_code_similarity(code_a: str, code_b: str, language: str = "python") -> Dict[str, Any]:
    """
    Combines AST structural similarity and token-level TF-IDF similarity.
    Returns composite score, breakdown, method, and human explanation.
    """
    token_score = compute_token_similarity(code_a, code_b, language)
    ast_score = -1.0

    if language.lower() == "python":
        ast_score = compute_ast_similarity(code_a, code_b)

    if ast_score >= 0.0:
        composite_score = round(0.6 * ast_score + 0.4 * token_score, 4)
        method = "AST structural normalization + Token TF-IDF"
        explanation = f"Evaluated using {method} (AST: {round(ast_score*100, 1)}%, Token: {round(token_score*100, 1)}%)."
    else:
        composite_score = round(token_score, 4)
        method = "Token TF-IDF Cosine Similarity"
        explanation = f"Evaluated using {method} ({round(token_score*100, 1)}%)."

    return {
        "similarity_score": composite_score,
        "token_similarity": round(token_score, 4),
        "ast_similarity": round(ast_score if ast_score >= 0.0 else 0.0, 4),
        "method": method,
        "explanation": explanation
    }
