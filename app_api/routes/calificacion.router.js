var router = require('express').Router();
var CalificacionController = require('../controllers/calificacion.controller');

router.post('/csv', CalificacionController.csv);
router.post('/', CalificacionController.crearRegistro);
router.get('/:id_leccion/:id_grupo', CalificacionController.obtenerRegistro);
router.put('/:id_leccion/:id_grupo', CalificacionController.anadirParticipante);
router.put('/calificar/:id_leccion/:id_grupo', CalificacionController.calificar);


router.get('/:id_leccion', CalificacionController.obtenerRegistroPorLeccion);
//router.get('/:id_grupo' , CalificacionController.obtenerRegistroPorGrupo);
//router.get('/registros', CalificacionController.obtenerRegistroParalelo);

router.put('/:id_grupo', CalificacionController.anadirNombreGrupo);


router.get('/profesores/registros/todos', CalificacionController.obtenerCalificaciones);

router.put('/recalificar/leccion/:id_leccion/grupo/:id_grupo', CalificacionController.recalificar);


module.exports = router;
