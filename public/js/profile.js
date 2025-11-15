let currentUsername = null;

document.addEventListener("DOMContentLoaded", () => {

    // Mostrar el nombre de usuario y la imagen de perfil 
    const usernameDisplay = document.getElementById("profileUsernameDisplay");
    const previewImage = document.getElementById("profileImagePreview");

    if (usernameDisplay) {

        const username = sessionStorage.getItem('username');

        if (username) {
            usernameDisplay.textContent = username;
            currentUsername = username;
        } else {
            usernameDisplay.textContent = "Usuario no encontrado";
            usernameDisplay.style.color = "#ff4d4d";
            console.error("No se encontró 'username' en sessionStorage.");
        }
    }

    if (previewImage) {
        const userImage = sessionStorage.getItem('userImage');

        if (userImage && userImage !== 'null') {
            previewImage.src = userImage;
        }
    }

    // Formulario de perfil
    const profileSection = document.getElementById("profile");
    if (!profileSection) {
        return;
    }

    const form = document.getElementById("profileUploadForm");
    const fileInput = document.getElementById("profileImageInput");
    const uploadButton = document.getElementById("profileUploadBtn");
    const messageDiv = document.getElementById("profileMessage");

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Lógica de Subida del Formulario 
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];

        if (!currentUsername || currentUsername === "Usuario no encontrado") {
            showMessage("Error: No se pudo obtener tu nombre de usuario. Intenta iniciar sesión de nuevo.", "error");
            return;
        }
        if (!file) {
            showMessage("Por favor, selecciona una imagen para subir.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("name", currentUsername);
        formData.append("image", file);

        //Enviar al Backend
        showMessage("Subiendo imagen...", "info");
        uploadButton.disabled = true;

        try {
            const response = await fetch("/mysql/upload-profile", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                showMessage("¡Imagen subida con éxito!", "success");
                sessionStorage.setItem('userImage', result.filePath);
            } else {
                throw new Error(result.message || "Error desconocido del servidor.");
            }

        } catch (err) {
            console.error("Error al subir la imagen:", err);
            showMessage(`Error: ${err.message}`, "error");
        } finally {
            uploadButton.disabled = false;
        }
    });

    // Función para mostrar mensajes
    function showMessage(message, type) {
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.className = "profile-message";

        if (type === "success") {
            messageDiv.classList.add("success");
        } else if (type === "error") {
            messageDiv.classList.add("error");
        } else {
            messageDiv.classList.add("info");
        }

        messageDiv.style.display = "block";
    }
});