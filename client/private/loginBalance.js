// DOM elements
    const passwordInput = document.getElementById('adminPassword');
    
    // Toggle password
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Toggle icon
      this.querySelector('i').classList.toggle('fa-eye');
      this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    document.getElementById('adminLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    // Validar datos
    if (!nombre || !email || !password) {
        alert("Por favor complete todos los campos.");
        return;
    }

    // Construir el objeto con los datos del formulario
    const adminData = {
        nombre,
        email,
        password
    };

    try {
        // Enviar los datos al servidor
        const response = await fetch("http://localhost:8080/administrador", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(adminData),
            credentials: "include",
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message);

            // Redirigir a la página de administración
            window.location.href = '/client/private/admin_control.html';
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (err) {
        console.error('Error al iniciar sesión:', err);
        alert("Hubo un error al iniciar sesión.");
    }
});
