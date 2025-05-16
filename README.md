# 💙 Vocalink:

A document editor that lets neurodivergent users (ADHD, ASD, dyslexia, dysgraphia, etc.) dictate, edit, and transform text naturally, without special voice commands.

## 👥 Team:

**Team Name:** (N + 1)-th Time's the Charm

### 💪🏼 Team Members:

<div align="center">
  <table>
      <tr>
      <td align="center"><a href="https://github.com/huzaifakhan04"><img src="https://avatars.githubusercontent.com/u/113238098?v=4" width="100px" alt="huzaifakhan04" style="border-radius: 50%"><br><sub><b>Huzaifa Khan</b></sub></a><br><sub>Team Lead</sub></td>
      <td align="center"><a href="https://github.com/hash2004"><img src="https://avatars.githubusercontent.com/u/151638487?v=4" width="100px" alt="hash2004" style="border-radius: 50%"><br><sub><b>Hashim M. Nadeem</b></sub></a><br><sub>Team Member</sub></td>
      <td align="center"><a href="https://github.com/Ibzie"><img src="https://avatars.githubusercontent.com/u/57735223?v=4" width="100px" alt="Ibzie" style="border-radius: 50%"><br><sub><b>Ibrahim Akhtar</b></sub></a><br><sub>Team Member</sub></td>
    </tr>
  </table>
</div>

---

## 🛠️ Getting Started:

### 🔧 Run Backend (Locally):

To run the FastAPI backend locally:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🐳 Running With Docker:

### 🧠 Backend Service:

1. Build the Docker image:

    ```bash
    docker build -t vocalink:latest .
    ```

2. Run the container:

    ```bash
    docker run \
      -e GOOGLE_API_KEY="$GOOGLE_API_KEY" \
      -e AAI_API_KEY="$AAI_API_KEY" \
      -p 8000:8000 --privileged \
      vocalink:latest
    ```

---

### 🎨 Frontend Service:

1. Navigate to the frontend directory:

    ```bash
    cd vocalink-frontend
    ```

2. Build the Docker image:

    ```bash
    docker build \
      --build-arg AAI_API_KEY="$AAI_API_KEY" \
      -t vocalink-frontend:latest .
    ```

3. Run the container:

    ```bash
    docker run -p 3000:80 vocalink-frontend:latest
    ```

4. Access the frontend at: [http://localhost:3000](http://localhost:3000)

---

### 🧩 Run Entire Application via Docker Compose:

To run both frontend and backend using Docker Compose:

* Start services:

  ```bash
  docker compose up
  ```

* Rebuild and start services:

  ```bash
  docker compose up --build
  ```

---

## 📌 Environment Variables:

Make sure to set the following environment variables before running:

* `GOOGLE_API_KEY` – refers to the Gemini Developer API key. You can create one via the [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key).
* `AAI_API_KEY` – refers to the AssemblyAI API key. You can obtain it by signing up at the [AssemblyAI Dashboard](https://www.assemblyai.com/dashboard/signup)

> **Note:** Both API keys require credits to be purchased. They cannot be used on the free trial.