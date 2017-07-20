const CalificacionModel = require('../models/calificacion.model');
const GrupoModel = require('../models/grupo.model');
const EstudianteModel = require('../models/estudiante.model');
const LeccionModel = require('../models/leccion.model');
const ParaleloModel = require('../models/paralelo.model');
const ProfesorModel = require('../models/profesor.model');
const ParaleloController = require('../controllers/paralelos.controller');
const co = require('co');
var fs = require('fs');
var moment = require('moment');
var Excel = require("exceljs");
var unstream = require('unstream');

bodyParser        = require('body-parser');
var response = require('../utils/responses');


const crearRegistro = (req, res) => {
	GrupoModel.obtenerGrupo(req.body.grupo, (err, grupo) => {
		let calificacion = new CalificacionModel({
			leccion: req.body.leccion,
			grupo: req.body.grupo,
			calificacion: 0,
			leccionTomada: false,
			calificada: false,
			nombreGrupo: grupo.nombre,
			paralelo: req.body.paralelo,
			nombreParalelo: req.body.nombreParalelo
		});
		calificacion.crearRegistro((err, doc) => {
			if(err) return response.serverError(res);
			return response.creado(res);
		})
	})

}

const obtenerRegistro = (req, res) => {
	CalificacionModel.obtenerRegistro(req.params.id_leccion, req.params.id_grupo, (err, registro) => {
		if(err) return response.serverError(res);
		return response.ok(res, registro);
	});
}

const anadirParticipante = (req, res) => {
	CalificacionModel.anadirParticipante(req.params.id_leccion, req.params.id_grupo, req.body.estudiante, (err, doc) => {
		if(err) return response.serverError(res);
		return response.okActualizado(res);
	});
}

const calificar = (req, res) => {
	var estudiante = req.body.estudiante;
	var calificacion_nueva = req.body.calificacion;
	var id_leccion = req.params.id_leccion;
	var flag = false;
	var todosCalificados = true;
	CalificacionModel.calificar(req.params.id_leccion, req.params.id_grupo, req.body.calificacion, req.body.estudiante, (err, doc) => {
		//Primero añado la calificación al registro
		if(err){
			return response.serverError(res);
		}
		else{
			CalificacionModel.obtenerRegistro(req.params.id_leccion, req.params.id_grupo, (err, registro) => {
				//Luego obtengo el registro completo de la calificación. Para usar el array de participantes
				if(err) {
					return response.serverError(res);
				}else{
					//Luego, a cada participante del registro le añado la calificación a la lección tomada
					registro[0].participantes.forEach(function(estudianteId){
						EstudianteModel.calificarLeccion(estudianteId, id_leccion, calificacion_nueva, (err, doc) => {
							if(err) {
								flag = true;
								return response.serverError(res);
							}
						});
					});
					//Finalmente, tengo que cambiar el estado de la lección a 'calificado'
					//Para eso reviso primero si ya todos los grupos de esta lección fueron calificados.
					CalificacionModel.obtenerRegistroPorLeccion(id_leccion, (err, registros) => {
						if(err){
							return response.serverError(res);
						}
						else{
							if(registros!=null){
								//Recorro todos los registros de la lección que se está calificando
								registros.forEach(function(registroCalificacion){
									//Si hay por lo menos uno que no ha sido calificado entonces no cambio esta cosa.
									if(!registroCalificacion.calificada&&registroCalificacion.participantes.length!=0){
										todosCalificados = false;
										return false;
									}
								});
								//Si al final de revisar todos los registros, veo que todos han sido calificados entonces cambio el estado
								if(todosCalificados){
									LeccionModel.calificar(id_leccion, (err, doc) => {
										if(err){
											flag = true;
											return response.serverError(res);
										}
									});
								}
							}
						}
					});
					if(!flag){
						return response.okActualizado(res);
					}
				}
			});
		}
	});
}


 const obtenerRegistroPorLeccion = (req, res) => {
	 CalificacionModel.obtenerRegistroPorLeccion(req.params.id_leccion, (err, registros) => {
	 if(err) return response.serverError(res);
	 return response.ok(res, registros);
	 });
 }

const recalificar = (req, res) => {
	var id_leccion = req.params.id_leccion;
	var id_grupo = req.params.id_grupo;
	var calificacion_nueva = req.body.calificacion;
	var id_estudiante = req.body.estudiante;
  var flag = false;
  //Cambiar el registro de calificaciones
	CalificacionModel.calificar(id_leccion, id_grupo, calificacion_nueva, id_estudiante, (err, doc) => {
		if(err) {
      return response.serverError(res);
    }else{

      CalificacionModel.obtenerRegistro(id_leccion, id_grupo, (err, registro) => {
        //Luego obtengo el registro completo de la calificación. Para usar el array de participantes
        if(err) {
          return response.serverError(res);
        }else{
          //Luego, a cada participante del registro le añado la calificación a la lección tomada
          registro[0].participantes.forEach(function(estudianteId){
            EstudianteModel.calificarLeccion(estudianteId, id_leccion, calificacion_nueva, (err, doc) => {
              if(err) {
                flag = true;
                return response.serverError(res);
              }
            });
          });

          if(!flag){
            return response.okActualizado(res);
          }
        }
      });
    }
		
	});
}

const anadirNombreGrupo = (req, res) => {
	CalificacionModel.anadirNombreGrupo(req.params.id_grupo, req.body.nombre_grupo, (err, doc) => {
		if (err) return response.serverError(res);
		return response.okActualizado(res);
	})
}


//Funciones para obtener los datos para generar el csv
const obtenerCalificaciones = (req, res) => {
	function obtenerParaleloProfesor(id_profesor){
		return new Promise((resolve, reject) => {
			ParaleloModel.obtenerParalelosProfesor(id_profesor, (err, paralelos) => {
				if (err) return reject(new Error('No se pudo obtener los paralelos'))
				return resolve(paralelos)
			})
		})
	}

	function obtenerLecciones(id_paralelo) {
		return new Promise((resolve, reject) => {
			LeccionModel.obtenerLeccionesParalelo(id_paralelo, (err, lecciones) => {
				if (err) return reject(new Error('No se pudo obtener las lecciones'))
				return resolve(lecciones)
			})
		})
	}

	function obtenerCalificacionPorLeccion(id_leccion){
		return new Promise((resolve, reject) => {
			CalificacionModel.obtenerRegistroPorLeccion(id_leccion, (err, registro) => {
				if (err) return reject(new Error('No se puedo obtener el registro'))
				return resolve(registro)
			})
		})
	}

	co(function* () {
		var id_profe = req.session._id;
		var calificacionesData = []; //Data para el JSON
		var campos = ['matricula', 'nombreEstudiante', 'apellidoEstudiante', 'grupo', 'materia', 'paralelo', 'nombreLeccion', 'tipoLeccion', 'puntaje'];

		var paralelo = yield obtenerParaleloProfesor(id_profe);
		//var lecciones = yield obtenerLecciones(paralelo[0]._id);

		if (paralelo.length > 1){
			console.log("OH NOOO ES UN PEER!!!");
			for(var z=0; z< paralelo.length; z++){
				var lecciones = yield obtenerLecciones(paralelo[z]._id);
				for (var i = 0; i < lecciones.length; i++){
					var calificacionesPorLeccion = yield obtenerCalificacionPorLeccion(lecciones[i]);
					for (var j = 0; j < calificacionesPorLeccion.length; j++){
						var calificacion = calificacionesPorLeccion[j];
						var participantes = calificacion.participantes;
						for (var x =0; x < participantes.length; x++){
							var calificacionJSON = {
								matricula: participantes[x].matricula,
								nombreEstudiante: participantes[x].nombres,
								apellidoEstudiante: participantes[x].apellidos,
								grupo: calificacion.nombreGrupo,
								materia: paralelo[0].nombreMateria,
								paralelo: calificacion.nombreParalelo,
								nombreLeccion: lecciones[i].nombre,
								tipoLeccion: lecciones[i].tipo,
								puntaje: calificacion.calificacion
							}
							calificacionesData.push(calificacionJSON);
						}
					}
				}
			}
		}else {
			console.log("Es un profesor!");
			var lecciones = yield obtenerLecciones(paralelo[0]._id);
			for (var i = 0; i < lecciones.length; i++){
				var calificacionesPorLeccion = yield obtenerCalificacionPorLeccion(lecciones[i]);
				for (var j = 0; j < calificacionesPorLeccion.length; j++){
					var calificacion = calificacionesPorLeccion[j];
					var participantes = calificacion.participantes;
					for (var x =0; x < participantes.length; x++){
						var calificacionJSON = {
							matricula: participantes[x].matricula,
							nombreEstudiante: participantes[x].nombres,
							apellidoEstudiante: participantes[x].apellidos,
							grupo: calificacion.nombreGrupo,
							materia: paralelo[0].nombreMateria,
							paralelo: calificacion.nombreParalelo,
							nombreLeccion: lecciones[i].nombre,
							tipoLeccion: lecciones[i].tipo,
							puntaje: calificacion.calificacion
						}
						calificacionesData.push(calificacionJSON);
					}
				}
			}
		}

		// var csv = json2csv({ data: calificacionesData, fields: campos});
		// fs.writeFile('Reporte1.csv', csv, function(err) {
		// 	if (err) throw err;
		// 	console.log('file saved');
		// });
		// response.ok(res)
	}).catch(fail => console.log(fail))
}

const csv = function(req, res) {
  // matricula, nombresEstudiante, apellidos, grupo, materia, paralelo, nombreLeccion, tipoLeccion, calificacion
  var lecciones = req.body.lecciones
  var paralelos = req.body.paralelos
  var grupos = req.body.grupos
  var id_profesor = req.session._id
  function obtenerParalelosPeer(id_profesor) {
    return new Promise((resolve, reject) => {
      ParaleloModel.obtenerParaleloPeerCsv(id_profesor, (err, paralelos) => {
        if (err) return reject(new Error('No se puedo obtener paralelos profesor'))
        return resolve(paralelos)
      })
    })
  }

  function obtenerParalelosProfesor(id_profesor) {
    return new Promise((resolve, reject) => {
      ParaleloModel.obtenerParaleloProfesorCsv(id_profesor, (err, paralelos) => {
        if (err) return reject(new Error('No se puedo obtener paralelos profesor'))
        return resolve(paralelos)
      })
    })
  }

  function obtenerProfesor(id_profesor) {
    return new Promise((resolve, reject) => {
      ProfesorModel.obtenerProfesor(id_profesor, (err ,profesor) => {
        if (err) return reject(new Error('No se puedo obtener profesor'))
        return resolve(profesor)
      })
    })
  }

  function obtenerCalificacionesPorLeccion(id_leccion) {
    return new Promise((resolve, reject) => {
      CalificacionModel.obtenerRegistroPorLeccionCsv(id_leccion, (err, lecciones) => {
        if (err) return reject(new Error('No se puedo obtener leccion'))
        return resolve(lecciones)
      })
    })
  }

  function obtenerCalificacionesPorParalelo(id_paralelo) {
    return new Promise((resolve, reject) => {
      CalificacionModel.obtenerRegistroPorParaleloCsv(id_paralelo, (err, lecciones) => {
        if (err) return reject(new Error('No se puedo obtener leccion'))
        return resolve(lecciones)
      })
    })
  }

  function obtenerNivelParaleloPeer(peer) {
    return new Promise((resolve, reject) => {
      for (var i = 0; i < peer.nivelPeer.length; i++) {
        if (peer.nivelPeer[i].nivel == 1) {
          return resolve(peer.nivelPeer[i].paralelo)
        }
      }
      return resolve(false) // no es profesor nivel peer uno de ningun paralelo
    })
  }

  function obtenerLeccionesParalelo(id_paralelo) {
    return new Promise((resolve, reject) => {
      LeccionModel.obtenerLeccionesParalelo(id_paralelo, (err, leccionesParalelo) => {
        if (err) return reject(new Error('No se puedo obtener leccion'))
        return resolve(leccionesParalelo)
      })
    })
  }


  function obtenerParaleloDePeer(id_paralelo, paralelos) {
    return new Promise((resolve, reject) => {
      for (var i = 0; i < paralelos.length; i++) {
        if (paralelos[i]._id == id_paralelo) {
          return resolve(paralelos[i])
        }
      }
      return resolve(false)
    })
  }

  function noAsistencia(grupoTodos, grupoAsistencia) {
    var no_asistieron = []
    for (var i = 0; i < grupoTodos.estudiantes.length; i++) {
      var est = grupoAsistencia.participantes.some(est => est._id == grupoTodos.estudiantes[i]._id)
      if (!est) {
        no_asistieron.push(grupoTodos.estudiantes[i])
      }
    }
    return no_asistieron
  }

  function buscarEstudiantesGrupo(id_grupo, paralelo) {
    if (!paralelo.grupos ) {
      return false
    }
    return paralelo.grupos.find(grup => {
      if (id_grupo == grup._id) {
        return grup
      }
    })
  }

  function obtenerTodosEstudiantes() {
    return new Promise((resolve, reject) => {

    })
  }

  function ordenarPorGrupo(grupos) {
    return grupos.sort(function(a, b) {
      var a = parseInt(a.grupo.split(' ')[1])
      var b = parseInt(b.grupo.split(' ')[1])
      if (a > b) {
        return 1
      } else if (a < b) {
        return -1
      }
      return -1
    })
  }

  function leccionCalificada(leccion, calificaciones) {
    for (var i = 0; i < calificaciones.length; i++) {
      // console.log(calificaciones[i].leccion)
      if (leccion.estado == 'pendiente' || leccion.estado == 'tomando') {
        return false
      }
      if (calificaciones[i].leccion == leccion._id) {
        if ((!calificaciones[i].calificada && calificaciones[i].participantes.length != 0)) {
          return false
        }
      }
    }
    return true
  }

  function generarRowsGrupo(grupoCompleto, paralelo, leccionParalelo, noAsistieron, calificacion) {
    var grupo = []
    var estudiantes = grupoCompleto.estudiantes
    var no_entro = 'si'
    for (var i = 0; i < estudiantes.length; i++) {
      var no = noAsistieron.some(es => es._id == estudiantes[i]._id)
      if (no) {
        no_entro = 'no'
      }
      grupo.push({
        matricula: estudiantes[i].matricula,
        nombres: estudiantes[i].nombres,
        apellidos: estudiantes[i].apellidos,
        grupo: grupoCompleto.nombre,
        materia: paralelo.nombreMateria,
        paralelo: paralelo.nombre,
        nombreLeccion: leccionParalelo.nombre,
        tipoLeccion: leccionParalelo.tipo,
        noEntroALeccion: no_entro,
        calificacion: calificacion.calificacion
      })
      no_entro = 'si'
    }
    return grupo
  }

  co(function* (){
    var workbook = new Excel.Workbook();
    workbook.creator = 'joelerll';
    workbook.created = new Date();
    workbook.modified = new Date();

    var profesor = yield obtenerProfesor(id_profesor)
    var paralelo_titular = yield obtenerParalelosProfesor(id_profesor)

    var paralelos_peer = yield obtenerParalelosPeer(id_profesor)
    if (paralelos_peer || paralelo_titular) {
      if (!lecciones && !paralelos && !grupos) {
        // console.log(paralelo_titular);
        if (paralelos_peer.length) {
          var paralelo_peer_asignado = yield obtenerNivelParaleloPeer(profesor)
          var leccionesParalelo = yield obtenerLeccionesParalelo(paralelo_peer_asignado)
          var paralelo = yield obtenerParaleloDePeer(paralelo_peer_asignado, paralelos_peer)
        } else {
          var paralelo = paralelo_titular
          var leccionesParalelo = yield obtenerLeccionesParalelo(paralelo._id)
        }
        var documento = []
        for (var i = 0; i < leccionesParalelo.length; i++) {
          var calificaciones_leccion = yield obtenerCalificacionesPorLeccion(leccionesParalelo[i]._id)
          var calificada = leccionCalificada(leccionesParalelo[i], calificaciones_leccion)
          if (!calificada) {
            continue
          }
          var row = []
          if (calificaciones_leccion.length) {
            for (var j = 0; j < calificaciones_leccion.length; j++) {
              // console.log(calificaciones_leccion[i]);
              if (!calificaciones_leccion[j].grupo) {
                continue
              }
              var grupoCompleto = buscarEstudiantesGrupo(calificaciones_leccion[j].grupo._id, paralelo)
              if (!grupoCompleto || grupoCompleto.length == 0) {
                continue
              }
              var noAsistieron = noAsistencia(grupoCompleto, calificaciones_leccion[j])
              row = generarRowsGrupo(grupoCompleto, paralelo, leccionesParalelo[i], noAsistieron, calificaciones_leccion[j])
              documento = documento.concat(row)
            }
            documento = ordenarPorGrupo(documento)
            if (leccionesParalelo[i].fechaTerminada) {
              var fecha = moment(leccionesParalelo[i].fechaTerminada).format('DD_MMMM_YYYY-hh_mm')
            } else {
              var fecha = moment(leccionesParalelo[i].fechaInicioTomada).add('m',leccionesParalelo[i].tiempoEstimado).format('DD_MMMM_YYYY-hh_mm')
            }
            var worksheet =  workbook.addWorksheet(fecha, {
              pageSetup:{paperSize: 9, orientation:'landscape'}
            });
            worksheet.columns = [
                { header: 'matricula', key: 'matricula', width: 12 },
                { header: 'nombres', key: 'nombres', width: 25 },
                { header: 'apellidos', key: 'apellidos', width: 25},
                { header: 'calificación', key: 'calificacion', width: 15, 'font': {'size': 12,'color': {'argb': 'FFFF6600'}}},
                { header: 'grupo', key: 'grupo', width: 8},
                { header: 'dio lección', key: 'noEntroALeccion', width: 15},
                { header: 'nombre lección', key: 'nombreLeccion', width: 54},
                { header: 'tipo lección', key: 'tipoLeccion', width: 23},
                { header: 'materia', key: 'materia', width: 10},
                { header: 'paralelo', key: 'paralelo', width: 10},
            ];
            // worksheet.autoFilter = 'B1:D1';
            var titulos = {
                name: 'Comic Sans MS',
                family: 4,
                size: 9,
                bold: true
            }

            var aligin = { vertical: 'middle', horizontal: 'center' }
            var celdas = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']
            var fill = { type: 'pattern', pattern:'darkTrellis', fgColor:{argb:'93C0F2'}, bgColor:{argb:'FFC0C0C0'}}

            for (var l = 0; l < celdas.length; l++) {
              worksheet.getCell(celdas[l]).font = titulos
              worksheet.getCell(celdas[l]).alignment = aligin
            }
            var newArray = documento.slice();
            for (var k = 0; k < newArray.length; k++) {
              worksheet.addRow({matricula: parseInt(newArray[k].matricula), nombres: newArray[k].nombres, apellidos: newArray[k].apellidos, grupo: newArray[k].grupo, materia: newArray[k].materia, paralelo: parseInt(newArray[k].paralelo), nombreLeccion: newArray[k].nombreLeccion, tipoLeccion: newArray[k].tipoLeccion, noEntroALeccion: newArray[k].noEntroALeccion, calificacion:  newArray[k].calificacion});
              worksheet.getCell('D' + (k + 2)).fill = fill;
            }
            // worksheet.getCell('J2').fill = ;
            documento = []
          }
        }

        workbook.xlsx.write(unstream({}, function(data) {
          return respuesta.ok(res,data.toString('base64'))
        }))

      }
    }
  }).catch(fail => console.log(fail))
}

module.exports = {
	crearRegistro,
	obtenerRegistro,
	anadirParticipante,
	calificar,
	obtenerRegistroPorLeccion,
	obtenerCalificaciones,
	recalificar,
	anadirNombreGrupo,
  csv
}
