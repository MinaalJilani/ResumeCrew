import requests

res = requests.post("http://localhost:8000/upload", files={"file": ("test.txt", "hello world")}, data={"doc_type": "cv"}, headers={"Authorization": "Bearer fake"})
print(res.status_code)
print(res.text)
