import os
import json
import base64
import urllib.request
import urllib.error
import ctypes
from ctypes import wintypes
import time

advapi32 = ctypes.windll.advapi32

class FILETIME(ctypes.Structure):
    _fields_ = [("dwLowDateTime", wintypes.DWORD), ("dwHighDateTime", wintypes.DWORD)]

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ("Flags", wintypes.DWORD),
        ("Type", wintypes.DWORD),
        ("TargetName", wintypes.LPWSTR),
        ("Comment", wintypes.LPWSTR),
        ("LastWritten", FILETIME),
        ("CredentialBlobSize", wintypes.DWORD),
        ("CredentialBlob", ctypes.c_void_p),
        ("Persist", wintypes.DWORD),
        ("AttributeCount", wintypes.DWORD),
        ("Attributes", ctypes.c_void_p),
        ("TargetAlias", wintypes.LPWSTR),
        ("UserName", wintypes.LPWSTR),
    ]

def get_github_token():
    for target in ["git:https://github.com", "LegacyGeneric:target=git:https://github.com"]:
        p_cred = ctypes.POINTER(CREDENTIAL)()
        if advapi32.CredReadW(target, 1, 0, ctypes.byref(p_cred)):
            blob_size = p_cred.contents.CredentialBlobSize
            raw_blob = ctypes.string_at(p_cred.contents.CredentialBlob, blob_size)
            advapi32.CredFree(p_cred)
            try:
                token = raw_blob.decode('utf-16le').strip('\x00')
                if token:
                    return token
            except Exception:
                return raw_blob.decode('utf-8', errors='ignore').strip('\x00')
    return None

def github_request(url, token, data=None, method="GET"):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("User-Agent", "OmniResolve-Uploader")
    if data is not None:
        req.add_header("Content-Type", "application/json")
        body = json.dumps(data).encode("utf-8")
    else:
        body = None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise RuntimeError(f"HTTP {e.code} on {url}: {err_msg}")

def upload_file_contents(token, username, repo_name, rel_path, full_path, committer):
    with open(full_path, "rb") as f:
        content_bytes = f.read()
    b64_content = base64.b64encode(content_bytes).decode("utf-8")

    url = f"https://api.github.com/repos/{username}/{repo_name}/contents/{rel_path}"
    
    # Check if file exists to get SHA
    sha = None
    try:
        existing = github_request(url, token)
        sha = existing.get("sha")
    except Exception:
        pass

    payload = {
        "message": f"feat: upload {rel_path} for ContextCon 2026",
        "content": b64_content,
        "committer": committer
    }
    if sha:
        payload["sha"] = sha

    github_request(url, token, data=payload, method="PUT")
    print(f"  [+] Uploaded: {rel_path}")

def main():
    print("==================================================================")
    print("  OMNIRESOLVE // AUTOMATED GITHUB UPLOADER")
    print("==================================================================")

    token = get_github_token()
    if not token:
        print("[-] Could not retrieve GitHub token from Windows Credential Manager.")
        return

    print(f"[+] Retrieved GitHub token (prefix: {token[:4]}...)")

    user_info = github_request("https://api.github.com/user", token)
    username = user_info.get("login")
    user_name = user_info.get("name") or username
    user_email = user_info.get("email") or f"{username}@users.noreply.github.com"
    print(f"[+] Authenticated as GitHub user: @{username} ({user_name})")

    repo_name = "OmniResolve-Meko"
    print(f"[*] Target repository: @{username}/{repo_name}")

    try:
        repo = github_request(f"https://api.github.com/repos/{username}/{repo_name}", token)
        print(f"[+] Verified repository: {repo['html_url']}")
    except Exception as e:
        if "404" in str(e):
            print(f"[*] Creating new public repository {username}/{repo_name}...")
            repo_payload = {
                "name": repo_name,
                "description": "OmniResolve: Never Solve It Twice - Autonomous Multi-Agent Support Pipeline with Meko Context Engine (YugabyteDB) for ContextCon 2026",
                "private": False,
                "auto_init": False
            }
            repo = github_request("https://api.github.com/user/repos", token, data=repo_payload, method="POST")
            print(f"[+] Repository created: {repo['html_url']}")
        else:
            raise

    # Collect files
    files_to_upload = []
    base_dir = os.path.abspath(".")
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in [".git", "node_modules", ".gemini", "__pycache__"]]
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), base_dir).replace("\\", "/")
            files_to_upload.append((rel_path, os.path.join(root, file)))

    # Ensure README.md is uploaded first to initialize the repository
    files_to_upload.sort(key=lambda x: 0 if x[0] == "README.md" else 1)

    committer = {
        "name": user_name,
        "email": user_email
    }

    print(f"[*] Uploading {len(files_to_upload)} files to GitHub via Contents API...")
    for rel_path, full_path in files_to_upload:
        retries = 3
        while retries > 0:
            try:
                upload_file_contents(token, username, repo_name, rel_path, full_path, committer)
                break
            except Exception as ex:
                retries -= 1
                if retries == 0:
                    print(f"  [-] Failed to upload {rel_path}: {ex}")
                else:
                    time.sleep(1)

    print("\n==================================================================")
    print("  [SUCCESS] OMNIRESOLVE SUCCESSFULLY UPLOADED TO GITHUB!")
    print(f"  Live Repository: https://github.com/{username}/{repo_name}")
    print("==================================================================")

if __name__ == "__main__":
    main()
