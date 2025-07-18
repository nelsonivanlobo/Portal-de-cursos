const mp = new MercadoPago("----", {
  locale: "es-AR"
});

document.addEventListener('DOMContentLoaded', function () {
    // Seleccionar todos los enlaces del navbar
    const navLinks = document.querySelectorAll('.nav-link');

    // Agregar evento de clic a cada enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Eliminar la clase 'active' de todos los enlaces
            navLinks.forEach(nav => nav.classList.remove('active'));

            // Agregar la clase 'active' al enlace seleccionado
            link.classList.add('active');
        });
    });


    // Modal ---------------------------------------
    const videoModal = document.getElementById('videoModal');
    const videoElement = document.getElementById('videoElement');

    videoModal.addEventListener('hide.bs.modal', () => {
        videoElement.pause();
        videoElement.currentTime = 0;
    });


/* LOGIN DE USUARIO */
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('password').value;

    // Validar datos
    if (!correo || !contrasena) {
        alert("Por favor complete todos los campos.");
        return;
    }

    // Construir el objeto con los datos del formulario
    const alumnoData = {
        correo,
        contrasena
    };

    try {
        // Enviar los datos al servidor
        const response = await fetch("http://localhost:8080/alumno", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(alumnoData),
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            
            // Cerrar el modal
            const modalElement = document.getElementById('loginModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            // Limpiar el formulario
            document.getElementById('loginForm').reset();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (err) {
        console.error('Error al registrar el alumno:', err);
        alert("Hubo un error al registrar el alumno.");
    }
});


// CARGA DE CURSOS
    fetch('http://localhost:8080/api/cursos')
        .then(response => response.json())
        .then(courses => {
            const container = document.getElementById('courses-container');
            container.innerHTML = '';

            courses.forEach(course => {
                const courseCard = `
                    <div class="col-md-4 mb-4">
                        <div class="card course-card">
                            <img src="${course.imagen}" class="card-img-top" alt="${course.titulo}">
                            <div class="course-header">
                                <h5>${course.titulo}</h5>
                            </div>
                            <div class="card-body">
                                <div class="course-price">$${course.precio}</div>
                                <div class="course-duration"><i class="far fa-clock me-1"></i>Duración: ${course.duracion} meses</div>
                                <p class="card-text">${course.descripcion}</p>
                                <hr>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <a href="http://localhost:8080${course.ruta_pdf}" class="btn text-muted" target="_blank" rel="noopener noreferrer"><i class="fas fa-users me-1"></i>Mas info...</a>
                                    </div>
                                    <button class="btn btn-danger btn-comprar" data-curso="${course.titulo}" data-precio="${course.precio}">
                                      Comprar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += courseCard;
            });

            // Asignar eventos a los botones después de cargar los cursos
            const comprarButtons = document.querySelectorAll('.btn-comprar');
            comprarButtons.forEach(button => {
                button.addEventListener('click', function (e) {
                    const curso = this.getAttribute('data-curso');
                    const precio = this.getAttribute('data-precio');
                    document.getElementById('modal-curso-nombre').textContent = curso;
                    document.getElementById('modal-curso-precio').textContent = precio;

                    // Mostrar el modal de inscripción
                    const inscripcionModal = new bootstrap.Modal(document.getElementById('inscripcionModal'));
                    inscripcionModal.show();
                });
            });
        })
        .catch(error => console.error('Error al cargar los cursos:', error));
});


// MERCADO LIBRE
document.getElementById("checkout-btn").addEventListener("click", async () => {
    try {
        // Obtener los datos del curso
        const nombreCurso = document.getElementById('modal-curso-nombre').innerText;
        const precioTexto = document.getElementById('modal-curso-precio').innerText;
        const precio = parseFloat(precioTexto.replace('$', '').trim());

        // Obtener los datos del formulario
        const nombre = document.getElementById('nombre').value;
        const telefono = document.getElementById('telefono').value;
        const email = document.getElementById('email').value;
        const provincia = document.getElementById('provincia').value;

        // Validar datos
        if (!nombreCurso || isNaN(precio) || !nombre || !email || !provincia) {
            alert("Por favor complete todos los campos correctamente.");
            return;
        }

        // Construir el objeto con los datos de la compra
        const orderData = {
            title: nombreCurso,
            quantity: 1,
            price: precio,
            cliente: {
                nombre,
                telefono,
                email,
                provincia
            }
        };

        // Enviar los datos al servidor
        const response = await fetch("http://localhost:8080/create_preference", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        const preference = await response.json();
        createCheckoutButton(preference.id);
    } catch (err) {
        alert("Hubo un error al procesar la compra.");
        console.error(err);
    }
});

/* cambios --------------------------------------------------------------- */
const createCheckoutButton = (preferenceId) => {
    const bricksBuilder = mp.bricks(); // Mercado Pago Bricks
    const renderComponent = async () => {
        if (window.checkoutButton) window.checkoutButton.unmount();

        // Ocultar el botón de "Realizar Compra"
        document.getElementById('checkout-btn').style.display = 'none';

        // Renderizar el botón de Mercado Pago
        await bricksBuilder.create("wallet", "wallet_container", {
            initialization: {
                preferenceId: preferenceId,
            },
        });
    };
    renderComponent();
};

// Listener para reiniciar el modal al cerrarse
const inscripcionModal = document.getElementById('inscripcionModal');
inscripcionModal.addEventListener('hidden.bs.modal', () => {
    // Reinicia el formulario de inscripción
    document.getElementById('inscripcionForm').reset();

    // Restablece el botón "Realizar Compra"
    const checkoutButton = document.getElementById('checkout-btn');
    checkoutButton.style.display = 'block';

    // Limpia el contenedor del botón de Mercado Pago
    const walletContainer = document.getElementById('wallet_container');
    walletContainer.innerHTML = '';
});