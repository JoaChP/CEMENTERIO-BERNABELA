# Usuarios y auditoría

El menú administrativo agrupa Crear registro, Ver registros y Ubicación de nichos
en **Información del difunto**. El grupo **Usuarios** contiene Gestión de usuarios,
Auditoría y Mi contraseña.

Los administradores gestionan cuentas y consultan el historial. Los operadores
solo pueden consultar difuntos, el plano y descargar PDF. Solamente los
administradores crean, editan y eliminan registros. Los permisos se verifican en el backend.

Las cuentas existentes mantienen el rol administrador y permanecen activas.
Se crean usuarios desde el panel; no existe registro público. La desactivación,
el cambio de datos de cuenta y el restablecimiento de contraseña invalidan sus
sesiones anteriores. Cada persona puede cambiar su propia contraseña.
Un administrador no puede desactivar su cuenta ni quitarse su propio rol, y
debe permanecer al menos un administrador activo.

La auditoría registra actor, fecha, entidad y valores anteriores y nuevos de
los cambios en difuntos y cuentas. Conserva los datos anteriores de un difunto
eliminado. Las contraseñas y sus hashes quedan excluidos. La modificación y el
evento se guardan en la misma transacción. El historial se puede filtrar por
usuario, acción y fechas en hora de Costa Rica; no tiene opciones de edición
ni eliminación desde la aplicación. Empieza con esta versión: no reconstruye
acciones anteriores a su activación.

Antes de ejecutar esta versión, aplicar `alembic upgrade head` en el backend.
