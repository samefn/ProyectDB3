## Soccer Dashboard. Base de datos dual con MySql y firebase
Soccer Dashboard es una aplicación web diseñada para la administración y visualización de datos de fútbol. La característica principal de este proyecto es su arquitectura de doble base de datos, que utiliza Google Firebase (NoSQL) para datos flexibles y anidados (como jugadores con sus estadísticas de partido) y MySQL (SQL) para datos relacionales estructurados (como clubes, partidos y jugadores).

La plataforma permite a los usuarios:

Autenticarse en un sistema de usuarios (Login y Perfil).

Realizar operaciones CRUD (Crear, Leer, Insertar, Actualizar) en ambas bases de datos a través de una interfaz tabulada.

Visualizar datos de SQL con paginación del lado del servidor.

Actualizar su perfil de usuario, incluyendo una foto.

Ejecutar un proceso ETL (Extract, Transform, Load) para migrar datos de jugadores desde la base de datos NoSQL (Firebase) a la base de datos SQL (MySQL).


## Tecnologias usadas
Frontend:
HTML
CSS
JavaScript
Fetch API

Backend:
Node.js
Express.js

Bases de Datos:
MySQL (Relacional)
Google Firebase (No relacional)

Middleware y Librerías (Node.js)
express: Para el servidor y enrutamiento.
multer: Para la subida de archivos (imágenes de perfil).
mysql / mysql2: Para la conexión con la base de datos MySQL.
firebase-admin: Para la conexión con la base de datos Firebase.

Asistencia de IA (Gemini): Se utilizó Gemini AI como asistente durante la fase de desarrollo. Específicamente, se empleó para generar la maquetación (layout) de la interfaz de usuario utilizando el framework Bootstrap, para refinar el código CSS necesario para lograr una visualización estética y responsiva de las imágenes de perfil subidas por los usuarios, genero un codigo de ingreso de 20 datos para la base de datos sql y adicionalmente tambien fue utilizada para mejorar la redaccion de este archivo README.md


## Estructura de carpetas
El proyecto está organizado con el archivo server.js en la raíz, el cual levanta el servidor de Express. Este sirve los archivos estáticos (frontend como HTML y JavaScript del cliente) desde la carpeta public. Las imágenes subidas por los usuarios se almacenan en la subcarpeta public/uploads. La lógica del backend está separada en dos directorios principales: routes y services. La carpeta routes define todos los endpoints del API, divididos en subcarpetas para firebase y mysql, además de un archivo para las rutas etl. La carpeta services contiene la lógica de conexión a las bases de datos, con archivos separados para sqlService y firebaseService.


## Flujo de datos
Para los usuarios que aún no tienen una cuenta, el sistema maneja el registro a través de un endpoint específico en el backend:

Endpoint de Creación: El backend expone la ruta POST /mysql/postUser para manejar nuevos registros.

Cifrado en Frontend: El formulario de registro debe usar la misma función ApplyRules para "cifrar" la contraseña que elija el usuario tanto en el registro como en el ingreso.

Envío de Datos: El frontend envía el name (nombre de usuario) y la password (ya cifrada) al endpoint /mysql/postUser.

Inserción en Base de Datos: El backend (sqlRoutes.js) recibe estos datos e intenta insertarlos directamente en la tabla user de la base de datos MySQL.

Manejo de Duplicados: La base de datos está configurada para manejar conflictos. Si el name de usuario ya existe, el servidor detecta el error (ER_DUP_ENTRY) y responde con un estado de conflicto (409), informando que "El nombre de usuario ya existe".

Registro Exitoso: Si la inserción es exitosa, el servidor responde con un estado 200 y el mensaje "Registro exitoso".

Autenticación: El usuario ingresa sus credenciales en login.html. El archivo Login.js captura el evento, aplica el cifrado a la contraseña y la envía al endpoint /mysql/login-user.

Verificación del Backend: sqlRoutes.js recibe los datos y compara el nombre y la contraseña ya cifrada con los registros en la tabla user de MySQL.

Gestión de Sesión: Si la autenticación es exitosa, el backend devuelve los datos del usuario (nombre e imagen). Login.js guarda esta información en sessionStorage y redirige al usuario a indexsql.html.

Subida de Perfil: En la pestaña "Perfil", el usuario puede seleccionar una imagen. profile.js crea un objeto FormData que incluye la imagen y el nombre de usuario (tomado de sessionStorage) y lo envía a /mysql/upload-profile. El backend (sqlRoutes.js) usa multer para guardar la imagen en el servidor (en /public/uploads) y actualiza la ruta del archivo en la tabla user de MySQL.

Carga del Dashboard:
Perfil: profile.js lee el username y userImage del sessionStorage para mostrar la información del usuario en la pestaña de perfil.

Datos SQL: Los archivos como club.js y player.js se cargan y ejecutan una llamada fetch inicial (ej. fetchClubs(1)) a sus respectivos endpoints (ej. /mysql/get-all-clubs) para poblar las tablas.

Paginación: Cuando el usuario hace clic en "Siguiente" o "Anterior", se llama a la misma función fetch (ej. fetchClubs(page + 1)), pero pasando el nuevo número de página como parámetro. El backend (sqlRoutes.js) utiliza LIMIT y OFFSET en su consulta SQL para devolver solo el conjunto de datos solicitado.


## Proceso ETL(Extract, Transform, Load)
El proyecto incluye una ruta de ETL diseñada para migrar datos de jugadores desde la colección NoSQL de Firebase a la tabla SQL de MySQL.

Trigger: El proceso se inicia desde el frontend mediante la función migratePlayersToSql en firebasePlayer.js. Esta función envía una solicitud POST al endpoint /etl/players-to-sql.

1. Extract (Extracción)
El backend, en etlroutes.js, recibe la solicitud.
Se conecta a Firebase y extrae todos los documentos de la colección "player".

2. Transform (Transformación)
Los datos de Firebase (un array de objetos) se recorren y transforman. El código mapea los campos de Firebase (ej. firstName, clubId) a un array de valores que coincide con el orden de las columnas en la tabla MySQL.

    player.firstName ➔ first_name
    player.lastName ➔ last_name
    player.age ➔ age
    player.nationality ➔ nationality
    player.clubId ➔ club_id

3. Load (Carga)
El backend se conecta a MySQL.
Utiliza una consulta INSERT INTO player (...) VALUES ?, pasando el array transformado.

Se utiliza el AI (Auto Increment) en la tabla SQL, permitiendo que el proceso continúe sin fallar, sin embargo esto provoca que los datos de firebase se puedan duplicar en MySql al hacer uso de esta funcion en mas de una ocasion.


## Sistema de login y cifrado
El sistema de autenticación de este proyecto implementa un cifrado por sustitución personalizado definido en Login.js.

Cómo Funciona
Reglas de Cifrado: El archivo Login.js contiene un objeto rules que actúa como un diccionario. Mapea cada carácter alfanumérico (mayúsculas, minúsculas y números) a una cadena única de 5 caracteres.

    "a" se convierte en "k9jS1"
    "b" se convierte en "pQ7bN"
    "1" se convierte en "qW2eR"
    ... y así sucesivamente.

Proceso en el Login:

Cuando el usuario escribe su contraseña (ej. admin123) y presiona "Ingresar".
La función ApplyRules en Login.js lee la contraseña admin123.
Itera sobre cada carácter y lo reemplaza por su correspondiente valor de 5 caracteres del objeto rules.
La contraseña original admin123 se transforma en una cadena mucho más larga (ej. k9jS1mO8pLnS5jMoP2iU...).

Envío y Verificación:
Esta cadena "cifrada" (no la contraseña original admin123) es la que se envía al backend en el cuerpo de la solicitud a /mysql/login-user.
El backend (sqlRoutes.js) toma esta cadena larga y la compara directamente con lo que está almacenado en la columna password de la tabla user en MySQL.

    SELECT * FROM user WHERE name = ? AND password = ?

Implicación Importante: Para que este sistema funcione, la base de datos debe almacenar la versión "cifrada" de la contraseña. Esto significa que el proceso de registro de usuarios (/mysql/postUser) debe usar exactamente la misma función ApplyRules antes de insertar la contraseña en la base de datos. La contraseña en texto plano (admin123) nunca se almacena ni se envía al backend (después del registro).


## Como ejecutarlo
Para poner en marcha este proyecto, necesitarás tener Git, Node.js, un servidor MySQL y una cuenta de Firebase.

1. Prerrequisitos
Asegúrate de tener instalado lo siguiente en tu sistema:

Node.js: Para gestionar las dependencias y ejecutar el servidor.
Servidor MySQL: Para la base de datos SQL.
Proyecto de Firebase: Una cuenta de Google Firebase para la base de datos NoSQL.

2. Clonar el Repositorio
Primero, clona el proyecto desde GitHub a tu computador.
Abre una terminal o consola.
Navega hasta la carpeta donde deseas guardar el proyecto.

Ejecuta el siguiente comando:
    git clone https://github.com/samefn/ProyectDB3.git

Ingresa a la carpeta del proyecto que acabas de clonar:
    cd ProyectDB3
    
3. Instalar Dependencias
Una vez dentro de la carpeta del proyecto, necesitas instalar todas las librerías de Node.js que el servidor utiliza (como Express, Multer, etc.).

Ejecuta el siguiente comando en tu terminal:
    npm install

Este comando leerá el archivo package.json y descargará todas las dependencias necesarias en una carpeta llamada node_modules.

4. Configurar las Bases de Datos
El proyecto no funcionará si no puede conectarse a las bases de datos.

A. Base de Datos MySQL
Inicia tu servidor MySQL.
Ejecuta el archivo DataSoccerDB.sql en tu servidor Mysql, este archivo te creara la base de datos SoccerDB si no existe y te ingresara 20 datos para cada una de las tablas de la base de datos menos la de user.

Importante (Registro): Para poder iniciar sesión, debes registrar un usuario. El registro se maneja en el endpoint /mysql/postUser. Asegúrate de que tu formulario de registro use la misma función ApplyRules de Login.js para cifrar la contraseña antes de enviarla al backend.

B. Base de Datos Firebase (NoSQL)
Ve a tu consola de Firebase.
Crea un nuevo proyecto.
Genera una clave de cuenta de servicio.
Guarda este archivo .json de forma segura en tu proyecto y asegúrate de que el archivo firebaseService.js lo esté utilizando para inicializar la conexión.

5. Iniciar el Servidor
Una vez que las dependencias estén instaladas y las bases de datos configuradas, puedes iniciar el servidor.

En tu terminal, desde la raíz del proyecto, ejecuta:
    node server.js

Si todo está correcto, deberías ver un mensaje en la consola indicando que el servidor está corriendo en el puerto 3000.

6. Acceder a la Aplicación
Finalmente, abre tu navegador web para comenzar.
    http://localhost:3000/login.html
   
## Integrantes y creditos
Todo el grupo participo de forma activa durante todo el semestre en todas las etapas del proyecto, sin embargo nos dividimos los trabajos por lo que algunos tuvimos mas influencia en algunos campos que en otros.

    Santiago Moreno Echeverria - Frontend, Backend (cifrado, ETL, SQL y Firebase routes)
    Julian Camilo Muñoz Melo- Backend (Paginación, ETL, SQL routes)
    Martin Velandia Linares- Frontend, Backend (Gestion de imagenes, ETL, Firebase routes)

## Modo demostración (versión en línea)

Para poder mostrar la aplicación en internet **sin publicar las credenciales** de MySQL ni de Firebase, el proyecto incluye un modo demostración.

**Cómo se activa:** automáticamente cuando no existe `env/serviceAccountKey.json`, o al definir la variable de entorno `DEMO_MODE=true`. Con `DEMO_MODE=false` se fuerza la conexión real.

**Qué hace:**
- Reemplaza MySQL y Firestore por bases de datos **en memoria** (`services/demo/`) que entienden las mismas consultas y respetan llaves primarias, `AUTO_INCREMENT`, `UNIQUE` y llaves foráneas.
- Carga los datos de `DataSoccerDB.sql` en la base SQL y jugadores y partidos de ejemplo en la base NoSQL, para probar también la migración (ETL) de Firebase a MySQL.
- Crea el usuario **demo / demo1234** y muestra un aviso en las páginas.
- Reinicia los datos cada 30 minutos (`DEMO_RESET_MINUTES`).

Las rutas, el frontend y la lógica ETL son los mismos que en la versión real. En local, con tus credenciales en `env/`, todo sigue conectándose a tus bases reales.

**Probarlo en local sin credenciales (PowerShell):**

    $env:DEMO_MODE="true"; npm start

**Publicarlo en Render:** New → Blueprint → seleccionar este repositorio (usa `render.yaml`), o New → Web Service con `npm install` / `node server.js` y la variable `DEMO_MODE=true`.
