from app.services.similarity import analyze_code_similarity, compute_ast_similarity, compute_token_similarity


def test_identical_code_similarity():
    code = """
def solve(n):
    total = 0
    for i in range(n):
        total += i
    return total
"""
    res = analyze_code_similarity(code, code, language="python")
    assert res["similarity_score"] >= 0.98
    assert res["token_similarity"] >= 0.98


def test_renamed_variables_ast_similarity():
    code_a = """
def calculate_sum(numbers):
    accumulator = 0
    for item in numbers:
        accumulator += item
    return accumulator
"""
    code_b = """
def compute_total(arr):
    res = 0
    for element in arr:
        res += element
    return res
"""
    res = analyze_code_similarity(code_a, code_b, language="python")
    # Structural AST flow is identical even though names are renamed!
    assert res["ast_similarity"] >= 0.85
    assert res["similarity_score"] >= 0.65


def test_unrelated_code_similarity():
    code_a = """
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
"""
    code_b = """
class DatabaseConnection:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.is_connected = False

    def connect(self):
        self.is_connected = True
        return self.is_connected
"""
    res = analyze_code_similarity(code_a, code_b, language="python")
    assert res["similarity_score"] < 0.40
