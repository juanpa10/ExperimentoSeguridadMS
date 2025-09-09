# ExperimentoSeguridadMS
Repositorio que contiene el experimento de seguridad del grupo 7

# Experimento ASR-11 — Seguridad con API Gateway

Este proyecto implementa un **experimento de arquitectura** para validar el requisito de seguridad **ASR-11** en MediSupply:

> “Si un usuario intenta acceder a una operación sensible sin permiso, el sistema debe bloquear la acción, generar una alerta en menos de 2 segundos y registrar el evento con trazabilidad completa”.

El entorno se ejecuta en contenedores Docker e incluye:
- **API Gateway**: punto de entrada que valida tokens JWT, aplica reglas RBAC y registra accesos no autorizados.
- **Products-API**: servicio de dominio que persiste los eventos de seguridad y dispara alertas.
- **Webhook Receiver**: receptor que mide el tiempo de entrega de alertas y expone métricas (p50, p95, p99).
- **Scripts/Postman**: para generar tráfico de prueba y validar los requisitos.

---

## Cómo correr el experimento

1. Clonar este repositorio o descomprimir el zip.
2. Ir a la carpeta raíz del proyecto:

   ```bash
   cd asr11-experiment
   ```

3. Levantar los contenedores:

   ```bash
   docker compose up --build
   ```

4. Probar el gateway:
   - Sin token : `401 Unauthorized`
   - Con token de `viewer` : `403 Forbidden` + auditoría + alerta
   - Con token de `security_admin` : `200 OK`

5. Consultar métricas de alertas:

   ```bash
   curl http://localhost:8082/metrics
   ```

   Ejemplo de salida:
   ```json
   {"count":120,"p50":150,"p95":400,"p99":600}
   ```

   - `p50`: mediana de latencia (la mitad de las alertas llegan más rápido que esto).  
   - `p95`: 95% de las alertas llegaron antes de este tiempo.  
   - `p99`: solo 1% de las alertas fueron más lentas.  

---

## Cómo probar

- **Con script Python**  
  Instala dependencias y lanza intentos denegados:
  ```bash
  pip install pyjwt requests
  python scripts/denied_test.py
  ```
  Después revisa:
  ```bash
  curl http://localhost:8082/metrics
  ```

- **Con Postman**  
  Importa la colección `ASR11_Gateway_Experiment.postman_collection.json` y el environment `ASR11_Local.environment.json`.  
  Ejecuta los requests para validar 401, 403, 200 y las métricas.

---

## Tecnologías utilizadas

- **Docker & Docker Compose**  
  Permiten empaquetar cada componente como un contenedor aislado y levantar el experimento fácilmente.

- **Node.js + Express**  
  Usado en los tres servicios (Gateway, Products-API, Webhook) para rapidez de prototipado y simplicidad en APIs REST.

- **JWT (JSON Web Tokens)**  
  Tokens firmados con HMAC usados para autenticar y autorizar usuarios. El Gateway valida firma y rol antes de permitir acceso.

- **RBAC (Role-Based Access Control)**  
  Control de acceso por roles. Solo `security_admin` puede ejecutar operaciones sensibles.

- **Webhook + CSV Audit**  
  Cada intento denegado se registra en un archivo CSV y dispara una alerta HTTP. Esto permite medir el tiempo de detección (<2s).

---

## Resultado esperado

- 100% de accesos no autorizados → bloqueados con `403`.  
- Alerta generada en menos de 2 segundos (p95 < 2000 ms).  
- Auditoría completa de cada evento con actor, rol, recurso, timestamp y request-id.

---

## Autores

Karen Tarazona
Felipe Rivera
Andrés Piarpuzan
Juan Pablo Camacho
