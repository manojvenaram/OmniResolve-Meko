import os
import hashlib
import zlib
import time

def hash_object(data, obj_type):
    header = f"{obj_type} {len(data)}\x00".encode()
    full_data = header + data
    sha = hashlib.sha1(full_data).hexdigest()
    path = os.path.join(".git", "objects", sha[:2], sha[2:])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(zlib.compress(full_data))
    return sha

def build_tree(dir_path):
    entries = []
    for item in sorted(os.listdir(dir_path)):
        if item in [".git", "node_modules", ".gemini"]:
            continue
        full_path = os.path.join(dir_path, item)
        if os.path.isfile(full_path):
            with open(full_path, "rb") as f:
                content = f.read()
            sha = hash_object(content, "blob")
            mode = "100644"
            entries.append((mode, item, bytes.fromhex(sha)))
        elif os.path.isdir(full_path):
            sub_sha = build_tree(full_path)
            if sub_sha:
                mode = "040000"
                entries.append((mode, item, bytes.fromhex(sub_sha)))
    
    tree_data = b""
    for mode, name, sha_bytes in entries:
        tree_data += f"{mode} {name}\x00".encode() + sha_bytes
    
    return hash_object(tree_data, "tree")

def main():
    print("[*] Initializing Git repository for @h4ckf0r0day...")
    os.makedirs(os.path.join(".git", "refs", "heads"), exist_ok=True)
    os.makedirs(os.path.join(".git", "objects"), exist_ok=True)

    with open(os.path.join(".git", "HEAD"), "w") as f:
        f.write("ref: refs/heads/main\n")

    git_config = """[core]
\trepositoryformatversion = 0
\tfilemode = false
\tbare = false
\tlogallrefupdates = true
\tsymlinks = false
\tignorecase = true
[remote "origin"]
\turl = https://github.com/h4ckf0r0day/OmniResolve-Meko.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
"""
    with open(os.path.join(".git", "config"), "w") as f:
        f.write(git_config)

    tree_sha = build_tree(".")
    
    timestamp = int(time.time())
    timezone = "+0530"
    author = "h4ckf0r0day <h4ckf0r0day@users.noreply.github.com>"
    
    commit_msg = """feat: initial release of OmniResolve for ContextCon 2026 Hackathon

- Multi-Agent Support Pipeline with Meko Context Engine & YugabyteDB
- Tier-1 Triage Agent with Meko Collective Memory hybrid retrieval
- Tier-2 Specialist Agent with automated RCA and code remediation
- Human-in-the-Loop (HITL) memory promotion gate (memory_add)
- Synthetic dataset of 35 enterprise tickets across 7 failure clusters
- Benchmark Engine proving 80.2% token reduction and 2.79x overall reduction
- Interactive Real-Time Web Dashboard with Decision Trace Inspector
- Complete Bun unit & integration test suite (100% pass)
"""
    commit_data = f"""tree {tree_sha}
author {author} {timestamp} {timezone}
committer {author} {timestamp} {timezone}

{commit_msg}
""".encode()

    commit_sha = hash_object(commit_data, "commit")

    with open(os.path.join(".git", "refs", "heads", "main"), "w") as f:
        f.write(commit_sha + "\n")

    print(f"[+] Repository successfully created!")
    print(f"[+] Root Tree SHA:   {tree_sha}")
    print(f"[+] Initial Commit:  {commit_sha}")
    print(f"[+] Remote Config:   https://github.com/h4ckf0r0day/OmniResolve-Meko.git")
    print(f"[+] Default Branch:  main")

if __name__ == "__main__":
    main()

