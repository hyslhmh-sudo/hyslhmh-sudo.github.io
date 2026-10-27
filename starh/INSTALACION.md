# STAR-H · App de relevamiento y tablero (versión 0)

## Qué hay en esta carpeta
- `Code.gs` → va en el Apps Script del libro **STAR-H · Tablero comparativo HySL** (es el que conecta la app con las planillas).
- `web/` → la app y el tablero. Se publican en GitHub Pages, en un repositorio `starh` de la cuenta hyslhmh-sudo:
  `https://hyslhmh-sudo.github.io/starh/` (app) y `https://hyslhmh-sudo.github.io/starh/tablero.html` (tablero).
- `web/portal-tarjeta.html` → bloque para pegar en el Portal HyS (acceso y tablero embebido).

## Paso 1 · Apps Script
1. Abrir el libro STAR-H · Tablero comparativo HySL › Extensiones › Apps Script.
2. Pegar el contenido completo de `Code.gs` (reemplazando lo que haya) y guardar.
3. Volver a la planilla y recargarla: aparece el menú **STAR-H app**.
4. STAR-H app › Preparar hojas de la app (la primera vez pide autorización: aceptar con belunchyy444).
5. En la hoja ACCESOS STAR-H, fila 2: escribir tu DNI. Seleccionar la fila › STAR-H app › Generar o reiniciar clave. Anotar la clave.
6. STAR-H app › Probar conexión con las planillas de las redes: tiene que mostrar ✔ en Trelew y Rawson.

## Paso 2 · Publicar el Apps Script
1. En el editor: Implementar › Nueva implementación › Tipo: Aplicación web.
2. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**.
3. Copiar la URL que termina en `/exec`.
(Cuando cambie Code.gs: Implementar › Gestionar implementaciones › editar › Versión nueva. La URL no cambia.)

## Paso 3 · Publicar la app
1. Crear el repositorio `starh` en hyslhmh-sudo (público, como los demás portales).
2. Subir todos los archivos de `web/`.
3. Editar `config.js` y pegar la URL `/exec` entre las comillas.
4. Settings › Pages › Deploy from a branch › main / (root).
5. Copiar también `Code.gs` al repositorio como respaldo.

## Paso 4 · Probar
- Abrir la app con `?demo=1` al final para practicar con datos de prueba (clave 123456): no toca las planillas.
- Ingresar con tu DNI y clave reales, cargar una amenaza y verificar que aparezca en la planilla de la red y en REGISTRO APP.

## Accesos
| Rol | Carga | Ve |
|---|---|---|
| Administración | todo | todas las redes y el comparativo |
| Referente | sus establecimientos | el tablero de su red |
| Consulta | nada | el tablero de sus redes (p. ej., una Dirección) |

## Sin señal
La app se guarda en el dispositivo. Lo cargado sin señal queda en cola y se envía solo al volver la conexión. Hay que ingresar al menos una vez con conexión en cada dispositivo.

## Sumar redes del área programática
Duplicar la planilla de una red, cargar sus establecimientos y agregar una fila en REDES (Estado «Activa»). La app y el tablero la toman solos; después se dan los accesos en ACCESOS STAR-H.
