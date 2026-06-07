-- Migración de limpieza: rol "ADMIN" huérfano del rename RolCodigo.ADMIN → ADMINISTRADOR.
-- La primera vez que se arrancó con el enum renombrado, quedó una fila con codigo='ADMIN'
-- y sin un usuario asociado nuevo (los admin users se les asignó ADMINISTRADOR).
-- Sin esta limpieza, Hibernate falla al hacer Rol.findByCodigo(ADMINISTRADOR) porque
-- el enum Java no reconoce el valor "ADMIN" al deserializar la fila legacy.

DELETE FROM usuario_roles
WHERE rol_id IN (SELECT id FROM roles WHERE codigo = 'ADMIN');

DELETE FROM roles WHERE codigo = 'ADMIN';
