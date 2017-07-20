var authApi = require('../config/auth.api')
var router = require('express').Router();
const LeccionController = require('../controllers/lecciones.controller');

router.get('/', authApi.estudiante, LeccionController.obtenerTodasLecciones);
router.get('/:id_leccion', authApi.estudiante, LeccionController.obtenerLeccion);
router.post('/', authApi.profesor, LeccionController.crearLeccion);
router.put('/:id_leccion', authApi.profesor, LeccionController.actualizarLeccion);
router.delete('/:id_leccion', authApi.profesor, LeccionController.eliminarLeccion);
router.post('/tomar/:id_leccion', authApi.profesor, LeccionController.tomarLeccion); // <= DOCUMENTACION
router.post('/comenzar_leccion/:id_leccion', authApi.profesor, LeccionController.comenzarLeccion) // <= DOCUMENTACION
router.post('/:id_paralelo/estudiantes', authApi.profesor, LeccionController.habilitarEstudiantesCursoParaLeccion) // DOCUMENTACION
router.post('/:id_leccion/mas_tiempo',authApi.profesor, LeccionController.anadirTiempo);


router.get('/paralelos/lecciones/:id_paralelo',authApi.profesor, LeccionController.obtenerLeccionesParalelo);

router.get('/:id_leccion/calificada' ,authApi.profesor, LeccionController.leccionYaCalificada);

router.get('/recalificar/:id_leccion', LeccionController.obtenerLeccionRecalificar);

module.exports = router;
