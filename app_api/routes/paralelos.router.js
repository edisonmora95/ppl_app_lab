var router = require('express').Router();
const ParalelosController = require('../controllers/paralelos.controller');

router.get('/', ParalelosController.obtenerTodosParalelos);
router.get('/:id_paralelo', ParalelosController.obtenerParalelo);
router.post('/', ParalelosController.crearParalelo);
router.put('/:id_paralelo', ParalelosController.actualizarParalelo);
router.delete('/:id_paralelo', ParalelosController.eliminarParalelo);

// grupos
router.post('/:id_paralelo/grupos/:id_grupo', ParalelosController.anadirGrupoAParalelo);
router.delete('/:id_paralelo/grupos/:id_grupo', ParalelosController.eliminarGrupoDeParalelo);

// profesores
router.post('/:id_paralelo/profesores/:id_profesor', ParalelosController.anadirProfesorAParalelo);
router.delete('/:id_paralelo/profesores', ParalelosController.eliminarProfesorDeParalelo);
router.get('/profesores/mis_paralelos', ParalelosController.obtenerParalelosProfesor);
router.post('/:id_paralelo/peers/:id_profesor', ParalelosController.anadirPeerAParalelo)

// estudiantes
router.post('/:id_paralelo/estudiantes/:id_estudiante', ParalelosController.anadirEstudianteAParalelo);
router.delete('/:id_paralelo/estudiantes/:id_estudiante', ParalelosController.eliminarEstudianteDeParalelo);
router.get('/estudiante/:id_estudiante', ParalelosController.obtenerParaleloDeEstudiante);


// Lecciones
router.post('/:id_paralelo/leccion/:id_leccion', ParalelosController.dandoLeccion) // <= DOCUMENTACION
// router.delete('/:id_paralelo/leccion', ParelelosController.terminadoLeccion) // <= DOCUMENTACION
router.post('/:id_paralelo/leccion_ya_comenzo', ParalelosController.leccionYaComenzo)
module.exports = router
