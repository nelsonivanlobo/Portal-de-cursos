// Admin panel tabs
document.querySelectorAll('.list-group-item').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remueve el active tabs
        document.querySelectorAll('.list-group-item').forEach(t => t.classList.remove('active'));
        
        // Activa el clicked tab
        e.currentTarget.classList.add('active');
        
        // Panel
        document.querySelectorAll('[id$="-panel"]').forEach(panel => {
            panel.classList.add('d-none');
        });
        
        const panelId = e.currentTarget.id.replace('-tab', '-panel');
        document.getElementById(panelId).classList.remove('d-none');
    });
});


// admin LOGIN
document.getElementById('cerrarSesion').addEventListener('click', async () => {
    try {
        // Llamar al endpoint de cierre de sesión
        const response = await fetch("http://localhost:8080/logout", {
            method: "POST",
            credentials: "include", // Asegura que las cookies de sesión sean enviadas
        });

        if (response.ok) {
            // Redirigir al login sin guardar la página anterior en el historial
            window.location.replace('/client/private/loginBalance.html');
        } else {
            alert('Error al cerrar sesión.');
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
});

//admin CURSOS
document.addEventListener('DOMContentLoaded', function () {
    const coursesTable = document.querySelector('.table-cursos tbody');

    // Función para cargar los cursos en la tabla
    function loadCourses() {
        fetch('http://localhost:8080/api/cursos')
            .then(response => response.json())
            .then(courses => {
                coursesTable.innerHTML = '';
                // Iterar sobre los cursos y añadir filas a la tabla
                courses.forEach(course => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${course.id_curso}</td>
                        <td><img src="${course.imagen}" width="50" height="50" class="rounded"></td>
                        <td>${course.titulo}</td>
                        <td>$${course.precio}</td>
                        <td>${course.duracion}</td>
                        <td>${course.descripcion}</td>
                        <td><a href="http://localhost:8080${course.ruta_pdf}"  target="_blank">Ver PDF</a></td>
                        <td><a href="http://localhost:8080${course.ruta_zip}" download>Desc ZIP</a></td>
                        <td><a href="${course.link_video}" target="_blank">video<a/></td>
                        <td>
                            <button class="btn btn-sm btn-info me-1" data-bs-toggle="modal" data-bs-target="#formEditModal" onclick="openEditModal(${course.id_curso})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCourse(${course.id_curso})"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    coursesTable.appendChild(row);
                });
            })
            .catch(err => console.error('Error al cargar los cursos:', err));
    }

    // Función para guardar un nuevo curso
    document.getElementById('saveButton').addEventListener('click', function() {
        const formData = new FormData();
        formData.append('imagen', document.getElementById('itemImage').value);
        formData.append('titulo', document.getElementById('itemName').value);
        formData.append('precio', document.getElementById('itemPrice').value);
        formData.append('duracion', document.getElementById('itemTime').value);
        formData.append('descripcion', document.getElementById('itemDescription').value);
        formData.append('pdf', document.getElementById('itemPDF').files[0]); // Cambiado a 'pdf'
        formData.append('zip', document.getElementById('itemZip').files[0]); // Cambiado a 'zip'
        formData.append('link_video', document.getElementById('itemLink').value);
    
        fetch('http://localhost:8080/api/cursos', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            alert('Curso agregado exitosamente');
            loadCourses();
            $('#formModal').modal('hide');
        })
        .catch(err => console.error('Error al agregar el curso:', err));
    });
    
// admin ACTUALIZAR
    function saveCourseChanges(courseId) {
        const formData = new FormData();
        formData.append('imagen', document.getElementById('editItemImage').value);
        formData.append('titulo', document.getElementById('editItemName').value);
        formData.append('precio', document.getElementById('editItemPrice').value);
        formData.append('duracion', document.getElementById('editItemTime').value);
        formData.append('descripcion', document.getElementById('editItemDescription').value);
        formData.append('link_video', document.getElementById('editItemLink').value);
    
        // Archivos PDF y ZIP
        const pdfFile = document.getElementById('editCurrentPDF').files[0];
        const zipFile = document.getElementById('editCurrentZIP').files[0];
    
        if (pdfFile) formData.append('pdf', pdfFile);
        if (zipFile) formData.append('zip', zipFile);
    
        fetch(`http://localhost:8080/api/cursos/${courseId}`, {
            method: 'PUT',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                alert('Curso actualizado exitosamente');
                loadCourses();
    
                // Cerrar el modal
                const modalElement = document.getElementById('formEditModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
            })
            .catch(err => console.error('Error al actualizar el curso:', err));
    }

 // Función para abrir el modal con los datos del curso seleccionado
 window.openEditModal = function (courseId) {
    fetch(`http://localhost:8080/api/cursos/${courseId}`)
        .then(response => response.json())
        .then(course => {
            document.getElementById('editItemImage').value = course.imagen || '';
            document.getElementById('editItemName').value = course.titulo || '';
            document.getElementById('editItemPrice').value = course.precio || '';
            document.getElementById('editItemTime').value = course.duracion || '';
            document.getElementById('editItemDescription').value = course.descripcion || '';
            document.getElementById('editItemLink').value = course.link_video || '';

            const currentPDFLink = document.getElementById('editCurrentPDF');
            if (course.ruta_pdf) {
                currentPDFLink.style.display = 'block';
                currentPDFLink.href = `http://localhost:8080${course.ruta_pdf}`;
            } else {
                currentPDFLink.style.display = 'none';
            }

            const currentZIPLink = document.getElementById('editCurrentZIP');
            if (course.ruta_zip) {
                currentZIPLink.style.display = 'block';
                currentZIPLink.href = `http://localhost:8080/download/${course.ruta_zip.split('/').pop()}`;
            } else {
                currentZIPLink.style.display = 'none';
            }

            document.getElementById('editButton').onclick = function () {
                saveCourseChanges(courseId);
            };
        })
        .catch(err => console.error('Error al cargar el curso:', err));
};

// Función para eliminar un curso
window.deleteCourse = function(courseId) {
    if (confirm('¿Estás seguro de que deseas eliminar este curso?')) {
        fetch(`http://localhost:8080/api/cursos/${courseId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('Curso eliminado');
            loadCourses();
        })
        .catch(err => console.error('Error al eliminar el curso:', err));
    }
}


// CARGA DE REPORTE
async function cargarReporte() {
            try {
                const response = await fetch('http://localhost:8080/api/compra');
                const datos = await response.json();

                const tabla = document.getElementById('compra');
                datos.forEach(compra => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${compra.id_compra}</td>
                        <td>${compra.titulo}</td>
                        <td>${compra.precio}</td>
                        <td>${compra.correo_alum}</td>
                        <td>${compra.nombre_alum}</td>
                        <td>${compra.telefono}</td>
                        <td>${compra.provincia}</td>
                        <td>${compra.fecha_compra}</td>
                    `;
                    tabla.appendChild(fila);
                });
            } catch (error) {
                console.error('Error al cargar el reporte:', error);
            }
        }
        cargarReporte();


// Función para obtener y mostrar las compras en la tabla
const mostrarCompras = async () => {
  try {
    // Llamar al backend para obtener las compras
    const response = await fetch("http://localhost:8080/api/compra");
    const compras = await response.json();

    // Referencia al cuerpo de la tabla donde se mostrarán los datos
    const tbody = document.getElementById("compras-tbody");
    tbody.innerHTML = "";

    // Recorrer las compras y agregarlas a la tabla
    compras.forEach(compra => {
      const row = document.createElement("tr");

      // Crear y agregar cada celda de la tabla
      row.innerHTML = `
        <td>${compra.id}</td>
        <td>${compra.nombre}</td>
        <td>${compra.correo}</td>
        <td>${compra.telefono || "No disponible"}</td>
        <td>${compra.provincia || "No disponible"}</td>
        <td>${compra.curso_adquirido}</td>
      `;

      // Agregar la fila a la tabla
      tbody.appendChild(row);
    });

    // Mostrar el panel de clientes (por si estaba oculto)
    document.getElementById("customers-panel").classList.remove("d-none");
  } catch (error) {
    console.error("Error al obtener las compras:", error);
  }
};

// Llamar a la función al cargar la página o cuando lo necesites
document.addEventListener("DOMContentLoaded", mostrarCompras);


//  FILTRAR POR CURSO O ALUMNO
document.getElementById('searchCurso').addEventListener('input', async (event) => {
    const searchTerm = event.target.value;

    try {
        const response = await fetch(`http://localhost:8080/api/compra?curso=${searchTerm}&alumno=${searchTerm}`); /* searchTerm término de búsqueda ingresado */
        if (!response.ok) throw new Error('Error al obtener los datos.');
        const compras = await response.json();

        const tbody = document.getElementById('compras-tbody');
        tbody.innerHTML = ''; // Limpiar contenido actual

        compras.forEach(compra => {
            const row = `
                <tr>
                    <td>${compra.id}</td>
                    <td>${compra.nombre}</td>
                    <td>${compra.correo}</td>
                    <td>${compra.telefono}</td>
                    <td>${compra.provincia}</td>
                    <td>${compra.curso}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error al filtrar las compras:', error);
    }
});

    loadCourses();
});