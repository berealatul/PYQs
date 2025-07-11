## How to Add New Subjects (Programmes) under cuetpg using the Template

To add a new academic subject (e.g., "Sociology", "Physics") under the cuetpg exam, you should copy and configure the `template_subject/` folder.

1.  **Duplicate the Template Folder:**

    - Navigate to the `cuetpg/` directory.
    - Make a copy of the `template_subject/` folder.
    - Don't `DELETE` or `MODIFY` original `template_subject/` folder.
    - Rename the copied folder to your subject's `value` (e.g., `sociology/`, `physics/`). This `value` will be used in URLs and JSON files.
    - Example: `cuetpg/template_subject_copy/` to `cuetpg/sociology/`

2.  **Configure `index.html` and `quiz-script.js` for the New Subject:**

    - Open `cuetpg/SUBJECT_VALUE/index.html` and `cuetpg/SUBJECT_VALUE/quiz-script.js` (e.g., `cuetpg/sociology/index.html`).
    - **Update the `subjectName` variable** in the `<script>` section to your subject's display name:
      ```javascript
      const subjectName = "Subject";
      ```

3.  **Configure `supportedYear.json` for the New Subject:**

    - Open `cuetpg/YOUR_SUBJECT_VALUE/supportedYear.json` (e.g., `cuetpg/sociology/supportedYear.json`).
    - Modify the years within this JSON file to reflect the specific years available for this new subject.

    ```json
    [
      { "name": "2025", "value": "2025" },
      { "name": "2024", "value": "2024" },
      { "name": "2023", "value": "2023" }
      // Add or remove years as applicable for 'Sociology'
    ]
    ```

4.  **Configure `supportedMedium.json` for the New Subject:**

    - Open `cuetpg/YOUR_SUBJECT_VALUE/supportedMedium.json` (e.g., `cuetpg/sociology/supportedMedium.json`).
    - Modify the mediums within this JSON file if they differ for this specific subject.

    ```json
    [
      { "name": "Hindi", "value": "H" },
      { "name": "English", "value": "E" }
      // Add or remove mediums as applicable for 'Sociology'
    ]
    ```

5.  **Manage Question Papers in `questions/` Directory:**

    - Navigate to `cuetpg/YOUR_SUBJECT_VALUE/questions/` (e.g., `cuetpg/sociology/questions/`).
    - **Remove or modify the existing `2025E.json` and `2025H.json` files** if they are not relevant to your new subject.
    - Add your new question paper JSON files here, following the naming convention `YYYYM.json`.

6.  **Update `cuetpg/supportedProgramme.json`:**
    - Open `your-app/cuetpg/supportedProgramme.json` (located in the `cuetpg/` parent directory).
    - Add a new entry for your subject. The `value` should exactly match the directory name you created in step 1.
    ```json
    [
      // ... existing entries (e.g., B.Ed.)
      {
        "name": "M.A. Sociology",  # Display name for the dropdown
        "value": "sociology"      # Must match the folder name you created
      }
    ]
    ```

## How to Add New Question Papers (within any subject)

To add new question papers for any specific subject (e.g., B.Ed., Sociology, Physics), follow these steps:

1.  **Locate the Correct `questions/` Directory:**

    - Navigate to the `questions/` directory for the specific subject and programme.
    - Example: `your-app/cuetpg/sociology/questions/`

2.  **Create a New JSON File:**

    - Create a new `.json` file inside this `questions/` directory.
    - **Naming Convention:** The file name MUST be `YYYYM.json`, where `YYYY` is the year and `M` is the medium's value (e.g., `2026E.json` for 2026 English, `2027H.json` for 2027 Hindi).

3.  **Populate the JSON File with Questions:**

    - Use the following template for the content of your new JSON file.
    - **Crucially, ensure the entire array of questions is wrapped within a root object with the key `"questions"`**.

    ```json
    {
      "questions": [
        {
          "questionNumber": 1,
          "questionContent": "Your first question content here.",
          "optionA": "Option A text",
          "optionB": "Option B text",
          "optionC": "Option C text",
          "optionD": "Option D text",
          "answer": "A"
        },
        {
          "questionNumber": 2,
          "questionContent": "Your second question content here.",
          "optionA": "Option A text",
          "optionB": "Option B text",
          "optionC": "Option C text",
          "optionD": "Option D text",
          "answer": "B"
        }
        // ... add more question objects ...
      ]
    }
    ```

    - **`questionNumber`**: (Optional) A unique number for the question. If not provided, the display will use its array index + 1.
    - **`questionContent`**: The full text of the question.
    - **`optionA`, `optionB`, `optionC`, `optionD`**: The text for each option.
    - **`answer`**: The correct option ('A', 'B', 'C', or 'D').
    - **`subject`**: (Optional but Recommended) The name of the subject for better organization and potential future filtering.

## Running the Application Locally

To run this application on your local machine, you need a simple web server.

1.  **Open your terminal or command prompt.**
2.  **Navigate to the root directory of your project** (where `index.html` is located).
3.  **Use Python's built-in HTTP server (if Python is installed):**
    ```bash
    python -m http.server
    ```
    (For Python 2, use `python -m SimpleHTTPServer`)
4.  **Open your web browser** and go to `http://localhost:8000` (or the address shown in your terminal).

Alternatively, if you use VS Code, the "Live Server" extension is highly recommended for local development.
