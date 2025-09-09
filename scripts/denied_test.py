import time, requests, jwt, os

SECRET = os.getenv("JWT_SECRET","secret123")
GATEWAY = os.getenv("GATEWAY_URL","http://localhost:8080")
N = int(os.getenv("N","50"))

def make_token(user="u1", role="viewer"):
  payload = {"user": user, "role": role, "iat": int(time.time()), "exp": int(time.time())+3600}
  return jwt.encode(payload, SECRET, algorithm="HS256")

def main():
  token = make_token()
  for i in range(N):
    r=requests.post(f"{GATEWAY}/products/PA/sensitive-op",
      headers={"Authorization": f"Bearer {token}"},json={"try":i})
    print(i,r.status_code,r.text)
    time.sleep(0.05)
  print("Check metrics: curl http://localhost:8082/metrics")

if __name__=="__main__":
  main()
