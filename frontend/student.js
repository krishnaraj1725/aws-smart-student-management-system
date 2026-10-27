
const table = document.getElementById("studentTable");
const totalStudents = document.getElementById("totalStudents");
const message = document.getElementById("message");
const dialog = document.getElementById("studentDialog");
const studentForm = document.getElementById("studentForm");

let students = [];

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed: ${response.status}`);
    }

    return data;
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b52e2a" : "#168153";
}

async function loadStudents() {
    table.innerHTML = '<tr><td colspan="5">Loading students...</td></tr>';

    try {
        const data = await apiRequest("/students");
        students = Array.isArray(data) ? data : data.students || [];

        totalStudents.textContent = students.length;
        renderStudents();
        showMessage("Student records loaded successfully.");
    } catch (error) {
        table.innerHTML =
            '<tr><td colspan="5">Could not load student records.</td></tr>';
        showMessage(error.message, true);
    }
}

function renderStudents() {
    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const filtered = students.filter(student =>
        [student.name, student.email, student.department]
            .some(value => String(value || "").toLowerCase().includes(search))
    );

    if (!filtered.length) {
        table.innerHTML =
            '<tr><td colspan="5">No student records found.</td></tr>';
        return;
    }

    table.replaceChildren();

    filtered.forEach(student => {
        const row = document.createElement("tr");

        [
            student.id,
            student.name,
            student.email,
            student.department
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        const actions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "secondary";
        editButton.addEventListener("click", () => openEditDialog(student));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "danger";
        deleteButton.addEventListener("click", () => deleteStudent(student.id));

        actions.append(editButton, deleteButton);
        row.appendChild(actions);
        table.appendChild(row);
    });
}

function openAddDialog() {
    studentForm.reset();
    document.getElementById("studentId").value = "";
    document.getElementById("dialogTitle").textContent = "Add Student";
    dialog.showModal();
}

function openEditDialog(student) {
    document.getElementById("studentId").value = student.id;
    document.getElementById("studentName").value = student.name || "";
    document.getElementById("studentEmail").value = student.email || "";
    document.getElementById("studentDepartment").value =
        student.department || "";

    document.getElementById("dialogTitle").textContent = "Edit Student";
    dialog.showModal();
}

studentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const id = document.getElementById("studentId").value;

    const student = {
        name: document.getElementById("studentName").value.trim(),
        email: document.getElementById("studentEmail").value.trim(),
        department: document.getElementById("studentDepartment").value.trim()
    };

    try {
        await apiRequest(
            id ? `/students/${encodeURIComponent(id)}` : "/students",
            {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(student)
            }
        );

        dialog.close();
        showMessage(id ? "Student updated." : "Student added.");
        await loadStudents();
    } catch (error) {
        showMessage(error.message, true);
    }
});

async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
        await apiRequest(`/students/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showMessage("Student deleted successfully.");
        await loadStudents();
    } catch (error) {
        showMessage(error.message, true);
    }
}

document.getElementById("addStudentBtn")
    .addEventListener("click", openAddDialog);

document.getElementById("cancelBtn")
    .addEventListener("click", () => dialog.close());

document.getElementById("refreshBtn")
    .addEventListener("click", loadStudents);

document.getElementById("searchInput")
    .addEventListener("input", renderStudents);

document.getElementById("uploadForm").addEventListener("submit", async event => {
    event.preventDefault();

    const fileInput = document.getElementById("document");
    const uploadMessage = document.getElementById("uploadMessage");
    const file = fileInput.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    uploadMessage.textContent = "Uploading document...";

    try {
        const result = await apiRequest("/upload-document", {
            method: "POST",
            body: formData
        });

        uploadMessage.textContent =
            result.message || "Upload request completed successfully.";
        fileInput.value = "";
    } catch (error) {
        uploadMessage.textContent = `Upload failed: ${error.message}`;
    }
});

loadStudents();
