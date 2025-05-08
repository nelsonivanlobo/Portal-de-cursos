// Admin panel tabs
document.querySelectorAll('.list-group-item').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all tabs
        document.querySelectorAll('.list-group-item').forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        e.currentTarget.classList.add('active');
        
        // Hide all panels
        document.querySelectorAll('[id$="-panel"]').forEach(panel => {
            panel.classList.add('d-none');
        });
        
        // Show the corresponding panel
        const panelId = e.currentTarget.id.replace('-tab', '-panel');
        document.getElementById(panelId).classList.remove('d-none');
    });
});


//admin.js
document.addEventListener('DOMContentLoaded', function () {
    const coursesTable = document.querySelector('.table-cursos tbody');
/*     const customersTable = document.querySelector('.table-client tbody');
    const documentsTable = document.querySelector('.table-doc tbody'); */

    // Función para cargar los cursos en la tabla
    function loadCourses() {
        fetch('http://localhost:8080/api/cursos')
            .then(response => response.json())
            .then(courses => {
                coursesTable.innerHTML = ''; // Limpiar la tabla antes de cargar los nuevos datos

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
            loadCourses(); // Recargar la tabla
            $('#formModal').modal('hide'); // Cerrar el modal
        })
        .catch(err => console.error('Error al agregar el curso:', err));
    });
    











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
                loadCourses(); // Recargar la lista de cursos
    
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
            loadCourses(); // Recargar los cursos después de eliminar
        })
        .catch(err => console.error('Error al eliminar el curso:', err));
    }
}



/* // Función para abrir el modal con los datos del curso seleccionado
window.openEditModal = function (courseId) {
    // Obtener los datos del curso desde el servidor
    fetch(`http://localhost:8080/api/cursos/${courseId}`)
        .then(response => response.json())
        .then(course => {
            // Asignar los valores del curso a los campos del formulario
            document.getElementById('itemImage').value = course.imagen || '';
            document.getElementById('itemName').value = course.titulo || '';
            document.getElementById('itemPrice').value = course.precio || '';
            document.getElementById('itemTime').value = course.duracion || '';
            document.getElementById('itemDescription').value = course.descripcion || '';

            // Manejar el PDF actual
            const currentPDFLink = document.getElementById('currentPDF');
            if (course.ruta_pdf) {
                currentPDFLink.style.display = 'block';
                currentPDFLink.href = `http://localhost:8080${course.ruta_pdf}`;
            } else {
                currentPDFLink.style.display = 'none';
            }

            // Cambiar los botones para edición
            document.getElementById('saveButton').style.display = 'none';
            document.getElementById('editButton').style.display = 'block';

            // Agregar el evento para guardar cambios
            document.getElementById('editButton').onclick = function () {
                saveCourseChanges(courseId);
            };
        })
        .catch(err => console.error('Error al cargar el curso:', err));
};

// Función para guardar los cambios del curso
function saveCourseChanges(courseId) {
    const formData = new FormData();
    formData.append('imagen', document.getElementById('itemImage').value);
    formData.append('titulo', document.getElementById('itemName').value);
    formData.append('precio', document.getElementById('itemPrice').value);
    formData.append('duracion', document.getElementById('itemTime').value);
    formData.append('descripcion', document.getElementById('itemDescription').value);

    // Manejar el archivo PDF (solo si se selecciona uno nuevo)
    const pdfFile = document.getElementById('itemPDF').files[0];
    if (pdfFile) {
        formData.append('documento', pdfFile);
    }

    fetch(`http://localhost:8080/api/cursos/${courseId}`, {
        method: 'PUT',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert('Curso actualizado');
            loadCourses(); // Recargar la lista de cursos
            $('#formModal').modal('hide'); // Cerrar el modal
        })
        .catch(err => console.error('Error al actualizar el curso:', err));
}
 */













/* // Función para cargar los documentos en la tabla
function loadDocuments() {
    fetch('http://localhost:8080/api/documentos')
        .then(response => response.json())
        .then(documents => {
            documentsTable.innerHTML = ''; // Limpiar la tabla antes de cargar los nuevos datos

            // Iterar sobre los documentos y añadir filas a la tabla
            documents.forEach(doc => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${doc.id_material}</td>
                    <td>${doc.titulo_curso}</td>
                    <td><a href="${doc.ruta_doc}" target="_blank">Ver Documento</a></td>
                    <td><a href="${doc.link_video}" target="_blank">Ver Video</a></td>
                    <td>
                        <button class="btn btn-sm btn-info me-1" data-bs-toggle="modal" data-bs-target="#formModal"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id_material})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                documentsTable.appendChild(row);
            });
        })
        .catch(err => console.error('Error al cargar los documentos:', err));
}


// Función para eliminar un documento
window.deleteDocument = function(docId) {
    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
        fetch(`http://localhost:8080/api/documentos/${docId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('Documento eliminado');
            loadDocuments(); // Recargar los documentos después de eliminar
        })
        .catch(err => console.error('Error al eliminar el documento:', err));
    }
} */












    loadCourses(); // Cargar los cursos al cargar la página
    /* loadClients(); // Cargar los clientes */
    loadDocuments(); // Cargar los documentos
});






























































































































































/* cargar los datos en la bd: *//* 
document.addEventListener("DOMContentLoaded", () => {
    const formModalLabel = document.getElementById("formModalLabel");
    const dynamicForm = document.getElementById("dynamicForm");

    document.getElementById("newCourseBtn").addEventListener("click", () => {
        formModalLabel.textContent = "Nuevo Curso";
        dynamicForm.reset();
        // Configurar campos específicos para cursos
    });

    document.getElementById("newDocumentBtn").addEventListener("click", () => {
        formModalLabel.textContent = "Nuevo Documento";
        dynamicForm.reset();
        // Configurar campos específicos para documentos
    });

    document.querySelectorAll(".btn-info").forEach((editBtn) => {
        editBtn.addEventListener("click", () => {
            formModalLabel.textContent = "Editar Elemento";
            dynamicForm.reset();
            // Prellenar formulario con los datos del elemento seleccionado
        });
    });
}); */

// Initialize Chart.js for admin analytics
/* window.addEventListener('DOMContentLoaded', () => {
    // Sales chart
    if (document.getElementById('salesChart')) {
        const ctx1 = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Ventas 2023',
                    data: [1200, 1900, 1700, 2100, 2300, 2800, 2400],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}); */

/* filtrado por cliente */
/* document.getElementById("searchCurso").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#customers-panel tbody tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const match = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(filter));
        row.style.display = match ? "" : "none";
    });
}); */



/* // Función para abrir el modal con datos de un curso para editar
window.openEditModal = function(courseId) {
    currentCourseId = courseId; // Establecer el ID del curso que estamos editando

    // Hacer una solicitud para obtener el curso
    fetch(`http://localhost:8080/api/cursos/${courseId}`)
        .then(response => response.json())
        .then(course => {
            // Rellenar los campos del formulario con los datos del curso
            document.getElementById('itemImage').value = course.imagen;
            document.getElementById('itemName').value = course.titulo;
            document.getElementById('itemPrice').value = course.precio;
            document.getElementById('itemTime').value = course.duracion;
            document.getElementById('itemDescription').value = course.descripcion;
            document.getElementById('formModalLabel').textContent = "Editar Curso";
            document.getElementById('saveButton').style.display = "none"; // Ocultar botón Guardar
            document.getElementById('editButton').style.display = "inline-block"; // Mostrar botón Editar
        })
        .catch(err => console.error('Error al obtener el curso:', err));
}
 */

/* // Función para editar un curso
document.getElementById('editButton').addEventListener('click', function() {
    const form = document.getElementById('formulario-curso');
    const formData = new FormData(form);
    fetch(`http://localhost:8080/api/cursos/${currentCourseId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert('Curso actualizado');
        loadCourses(); // Recargar los cursos después de editar
        $('#formModal').modal('hide'); // Cerrar el modal
    })
    .catch(err => console.error('Error al editar el curso:', err));
}); */



/* // Función para abrir el modal con datos de un curso para editar
window.openEditModal = function(courseId) {
    currentCourseId = courseId; // Establecer el ID del curso que estamos editando

    // Hacer una solicitud para obtener el curso
    fetch(`http://localhost:8080/api/cursos/${courseId}`)
        .then(response => response.json())
        .then(course => {
            // Rellenar los campos del formulario con los datos del curso
            document.getElementById('itemImage').value = course.imagen;
            document.getElementById('itemName').value = course.titulo;
            document.getElementById('itemPrice').value = course.precio;
            document.getElementById('itemTime').value = course.duracion;
            document.getElementById('itemDescription').value = course.descripcion;
            document.getElementById('formModalLabel').textContent = "Editar Curso";
            document.getElementById('saveButton').style.display = "none"; // Ocultar botón Guardar
            document.getElementById('editButton').style.display = "inline-block"; // Mostrar botón Editar
        })
        .catch(err => console.error('Error al obtener el curso:', err));
}


// Función para editar un curso
document.getElementById('editButton').addEventListener('click', function() {
    const form = document.getElementById('formulario-curso');
    const formData = new FormData(form);
    fetch(`http://localhost:8080/api/cursos/${currentCourseId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert('Curso actualizado');
        loadCourses(); // Recargar los cursos después de editar
        $('#formModal').modal('hide'); // Cerrar el modal
    })
    .catch(err => console.error('Error al editar el curso:', err));
}); */




/*     // Función para cargar los clientes en la tabla
function loadClients() {
    fetch('http://localhost:8080/api/clientes')
        .then(response => response.json())
        .then(clients => {
            customersTable.innerHTML = ''; // Limpiar la tabla antes de cargar los nuevos datos

            // Iterar sobre los clientes y añadir filas a la tabla
            clients.forEach(client => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${client.id_cliente}</td>
                    <td>${client.nombre}</td>
                    <td>${client.correo}</td>
                    <td>${client.telefono}</td>
                    <td>${client.ciudad}, ${client.provincia}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-1" data-bs-toggle="modal" data-bs-target="#formModal"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.id_cliente})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                customersTable.appendChild(row);
            });
        })
        .catch(err => console.error('Error al cargar los clientes:', err));
}

// Función para cargar los documentos en la tabla
function loadDocuments() {
    fetch('http://localhost:8080/api/documentos')
        .then(response => response.json())
        .then(documents => {
            documentsTable.innerHTML = ''; // Limpiar la tabla antes de cargar los nuevos datos

            // Iterar sobre los documentos y añadir filas a la tabla
            documents.forEach(doc => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${doc.id_material}</td>
                    <td>${doc.titulo_curso}</td>
                    <td><a href="${doc.ruta_doc}" target="_blank">Ver Documento</a></td>
                    <td><a href="${doc.link_video}" target="_blank">Ver Video</a></td>
                    <td>
                        <button class="btn btn-sm btn-info me-1" data-bs-toggle="modal" data-bs-target="#formModal"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id_material})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                documentsTable.appendChild(row);
            });
        })
        .catch(err => console.error('Error al cargar los documentos:', err));
}

// Función para eliminar un cliente
window.deleteClient = function(clientId) {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
        fetch(`http://localhost:8080/api/clientes/${clientId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('Cliente eliminado');
            loadClients(); // Recargar los clientes después de eliminar
        })
        .catch(err => console.error('Error al eliminar el cliente:', err));
    }
}

// Función para eliminar un documento
window.deleteDocument = function(docId) {
    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
        fetch(`http://localhost:8080/api/documentos/${docId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('Documento eliminado');
            loadDocuments(); // Recargar los documentos después de eliminar
        })
        .catch(err => console.error('Error al eliminar el documento:', err));
    }
} */


/* 
    document.getElementById('saveButton').addEventListener('click', function() {
        const form = document.getElementById('formulario-curso');
        const formData = new FormData(form);
        fetch('http://localhost:8080/api/cursos', { // /subir-pdf
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert('Curso agregado');
            loadCourses(); // Recargar los cursos después de agregar
            $('#formModal').modal('hide'); // Cerrar el modal
        })
        .catch(err => console.error('Error al agregar el curso:', err));
    }); */
    