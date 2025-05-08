const mp = new MercadoPago("public_key", {
  locale: "es-AR"
});

document.addEventListener('DOMContentLoaded', function() {
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

  // Handle buy button clicks
  const comprarButtons = document.querySelectorAll('.btn-comprar');
  comprarButtons.forEach(button => {
      button.addEventListener('click', function() {
          const curso = this.getAttribute('data-curso');
          const precio = this.getAttribute('data-precio');
          document.getElementById('modal-curso-nombre').textContent = curso;
          document.getElementById('modal-curso-precio').textContent = precio;
      });
  });

/*   // Handle form submission
  const btnRealizarCompra = document.getElementById('btnRealizarCompra');
  btnRealizarCompra.addEventListener('click', async function() {
      const form = document.getElementById('inscripcionForm');
      if (form.checkValidity()) {
          // Gather form values
          const nombre = document.getElementById('nombre').value;
          const email = document.getElementById('email').value;
          const telefono = document.getElementById('telefono').value;
          const provincia = document.getElementById('provincia').value;
          const ciudad = document.getElementById('ciudad').value;
          const cursoNombre = document.getElementById('modal-curso-nombre').textContent;

          // Determine courseId from mapping; default to an empty string if not found
          const courseId = courseMap[cursoNombre] || "";

          // Call the CoursePurchase Magic Loop API
          try {
              const response = await fetch('https://magicloops.dev/api/loop/92a1b0e3-2a93-47b2-b402-6da0a9f59075/run', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ courseId, name: nombre, email, phone: telefono, province: provincia, city: ciudad })
              });
              const responseJson = await response.json();

              if(responseJson.success) {
                  const modal = bootstrap.Modal.getInstance(document.getElementById('inscripcionModal'));
                  modal.hide();
                  
                  const alertDiv = document.createElement('div');
                  alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                  alertDiv.setAttribute('role', 'alert');
                  alertDiv.innerHTML = `
                      <strong>${responseJson.message}</strong>
                      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                  `;
                  document.body.appendChild(alertDiv);

                  setTimeout(() => { alertDiv.remove(); }, 5000);

                  const pdfSection = document.getElementById('pdfDownloadSection');
                  pdfSection.classList.remove('d-none');
                  pdfSection.scrollIntoView({ behavior: 'smooth' });

                  form.reset();
              } else {
                  alert('Hubo un problema: ' + responseJson.message);
              }
          } catch (error) {
              console.error('Error al llamar CoursePurchase Loop:', error);
              alert('Error al procesar su compra. Inténtelo nuevamente más tarde.');
          }
      } else {
          form.reportValidity();
      }
  }); */

  // Handle close button for PDF download section
  document.getElementById('closePdfSection').addEventListener('click', function() {
      document.getElementById('pdfDownloadSection').classList.add('d-none');
  });

  // Modal para mis cursos ---------------------------------------
  const videoModal = document.getElementById('videoModal');
  const videoElement = document.getElementById('videoElement');

  videoModal.addEventListener('hide.bs.modal', () => {
      videoElement.pause();
      videoElement.currentTime = 0;
  });

  // Cargar cursos
  fetch('http://localhost:8080/api/cursos')
  .then(response => response.json())
  .then(courses => {
      const container = document.getElementById('courses-container');
      container.innerHTML = ''; // Limpiar el contenedor

      courses.forEach(course => {
          console.log(course.ruta_pdf);
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
                              <button class="btn btn-danger btn-comprar" data-bs-toggle="modal" data-bs-target="#inscripcionModal" data-curso="${course.titulo}" data-precio="${course.precio}">
                                  Comprar
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          `;
          container.innerHTML += courseCard;
      });

      // Ahora que los botones están en el DOM, asignamos eventos
      const comprarButtons = document.querySelectorAll('.btn-comprar');
      comprarButtons.forEach(button => {
          button.addEventListener('click', function () {
              const curso = this.getAttribute('data-curso');
              const precio = this.getAttribute('data-precio');
              document.getElementById('modal-curso-nombre').textContent = curso;
              document.getElementById('modal-curso-precio').textContent = precio;
          });
      });
  })
  .catch(error => console.error('Error al cargar los cursos:', error));
});




document.getElementById("checkout-btn").addEventListener("click", async () => {
    try {
      // Obtener los datos del curso desde el DOM
      const nombre = document.getElementById('modal-curso-nombre').innerText;
      const precioTexto = document.getElementById('modal-curso-precio').innerText;
  
      // Limpiar y convertir el precio a número
      const precio = parseFloat(precioTexto.replace('$', '').trim());
  
      // Verificar que los datos sean válidos
      if (!nombre || isNaN(precio)) {
        alert("Error: Nombre o precio del curso no válidos.");
        return;
      }
  
      // Construir el objeto con los datos del pedido
      const orderData = {
        title: nombre,
        quantity: 1,
        price: precio
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

/* document.getElementById("checkout-btn").addEventListener("click", async ()=>{
  try{
    const orderData = {
      title: document.getElementById('modal-curso-nombre').innerText,
      quantity: 1,
      price: document.getElementById('modal-curso-precio').innerText
    };
  
    const response = await fetch("http://localhost:8080/create_preference", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
  
    const preference = await response.json()
    // recibo el id:
    createCheckoutButton(preference.id);
  }
  catch(err){
    alert("err :(");
  }
});

const createCheckoutButton = (preferenceId)=>{
  const bricksBuilder = mp.bricks(); // boton de pago

  const renderComponent = async ()=>{
    if (window.checkoutButton) window.checkoutButton.unmount(); // evita el generar mas botones

    await bricksBuilder.create("wallet", "wallet_container", {
      initialization: {
        preferenceId: preferenceId,
      },
    });
  };
  renderComponent()
}; */
