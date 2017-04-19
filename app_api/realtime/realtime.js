const cookie = require('cookie'),
cookieParser = require('cookie-parser'),
MongoClient  = require('mongodb').MongoClient,
moment       = require('moment'),
tz           = require('moment-timezone'),
co           = require('co');

require("moment-duration-format");

const url       = require('../utils/change_database').session(),
EstudianteModel = require('../models/estudiante.model'),
ProfesorModel   = require('../models/profesor.model'),
ParaleloModel   = require('../models/paralelo.model'),
GrupoModel      = require('../models/grupo.model'),
LeccionModel    = require('../models/leccion.model');

function realtime(io) {
  var leccion = io.of('/tomando_leccion');
  leccion.on('connection', function(socket) {
    var cook = obtenerCook(socket.request.headers.cookie)
    const obtenerProfesor = function(_usuario_cookie) {
      return new Promise((resolve,reject) => {
        ProfesorModel.obtenerProfesorPorCorreo(_usuario_cookie.correo, (err, profesor) => {
          if (err) return reject(err)
          if (!profesor) return resolve(false)
          obtenerParaleloProfesor(profesor._id,paralelo => {
            if (!paralelo) return resolve(false)
            // undefined si el paralelo no esta para dar leccion if(!paralelo)
            paralelo.grupos.forEach(grupo => {
              socket.join(paralelo._id)
              socket.join(grupo._id) // crear los room para cada grupo
            })
            return resolve(profesor)
          })
          socket.emit('ingresado profesor', profesor)
        })
      })
    }

    const obtenerEstudiante = function(_usuario_cookie) {
      return new Promise((resolve, reject) => {
        EstudianteModel.obtenerEstudiantePorCorreo(_usuario_cookie.correo, (err, estudiante) => {
          if (err) return reject(err)
          if (!estudiante) return resolve(false)
          return resolve(estudiante)
        })
      })
    }
    var interval
    co(function *() {
      const cookie = yield mongoSession(cook)
      const profesor = yield obtenerProfesor(cookie)
      const estudiante = yield obtenerEstudiante(cookie)
      if (profesor) {
        const hora_local = moment();
        const current_time_guayaquil = moment(hora_local.tz('America/Guayaquil').format());
        const paralelo = yield obtenerParaleloProfesorPromise(profesor)
        const leccion_tomando = yield obtenerLeccion(paralelo.leccion)
        const inicio_leccion = moment(leccion_tomando.fechaInicioTomada)
        console.log(`fecha inicio ${inicio_leccion.format('YY/MM/DD hh:mm:ss')}`);
        const tiempo_maximo = inicio_leccion.add(leccion_tomando.tiempoEstimado, 'm')
        console.log(`tiempo maximo ${tiempo_maximo.format('YY/MM/DD hh:mm:ss')}`);
        interval = setInterval(function() {
          let tiempo_rest = tiempo_maximo.subtract(1, 's');
          var duration = moment.duration(tiempo_rest.diff(current_time_guayaquil)).format("h:mm:ss");
          // console.log(`tiempo restado ${tiempo_rest.format('YY/MM/DD hh:mm:ss')}`);
          // console.log(`tiempo restante ${duration}`);
          // si duracion == 0, limpiar lecciones(dandoLeccion) y estudiantes(dandoLeccion)
          if (!isNaN(duration)) { // FIXME si se recarga la pagina antes que llege a cero continua
                        if (parseInt(duration) == 0) {
              clearInterval(interval);
              leccionTerminada(paralelo, paralelo.leccion)
                            leccion.in(paralelo._id).emit('terminado leccion', true)
                        }
                    }
          leccion.in(paralelo._id).emit('tiempo restante', duration)
        }, 1000)
      }
      if (estudiante) {
        const grupo = yield obtenerGrupo(estudiante)
        const paralelo = yield obtenerParaleloDeEstudiante(estudiante)
        // buscar leccion y emitir al estudiante
        socket.join(grupo._id)
        socket.join(paralelo._id)
        socket.to(grupo._id).emit('mi grupo', estudiante);
        socket.estudiante = estudiante
        socket.broadcast.emit('estudiante conectado', estudiante)
      }
    }).catch(fail => console.log(fail))
    socket.on('disconnect', function() {
      clearInterval(interval);
      socket.broadcast.emit('estudiante desconectado', socket.estudiante)
    })
    socket.on('parar leccion', function() {
      // boton para terminar la leccion
    })
  })
}

module.exports = realtime

function mongoSession(cook) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, function(err, db) {
      var collection = db.collection('sessions');
      collection.findOne({_id: cook}, function(err, docs) {
        var usuario_cookie = JSON.parse(docs.session)
        if (err) return reject(err);
        if (!docs) return reject('usuario no encontrado')
        resolve(usuario_cookie)
        db.close();
      })
    });
  })
}

function obtenerGrupo(_estudiante) {
  return new Promise((resolve, reject) => {
    GrupoModel.obtenerGrupoDeEstudiante(_estudiante._id, (err, grupo) => {
      if (err) return reject(err)
      if (!grupo) return resolve('no existe en grupo')
      return resolve(grupo)
    })
  })
}

function obtenerCook(cookie_socket) {
  var cookies = cookie.parse(cookie_socket);
  var cook = cookies['connect.sid'].split('.').filter((ele,index) => index == 0)[0].split(':')[1]
  return cook
}

function obtenerParaleloProfesorPromise(_profesor) {
  return new Promise((resolve, reject) => {
    ParaleloModel.obtenerParalelosProfesor(_profesor._id, (err, paralelos) => {
      let para = paralelos.find(paralelo => paralelo.dandoLeccion)
      if (err) return reject(null)
      return resolve(para)
    })
  })
}

function obtenerParaleloProfesor(_id, callback) {
    ParaleloModel.obtenerParalelosProfesor(_id, (err, paralelos) => {
      let para = paralelos.find(paralelo => paralelo.dandoLeccion)
      if (err) return callback(null)
      callback(para)
    })
}

function obtenerParaleloDeEstudiante(estudiante, callback) {
  return new Promise((resolve, reject) => {
    ParaleloModel.obtenerParaleloDeEstudiante(estudiante._id, (err, paralelo) => {
      if (err) return reject(null)
      return resolve(paralelo)
    })
  })
}

function obtenerLeccion(_id_leccion) {
  return new Promise((resolve, reject) => {
    LeccionModel.obtenerLeccion(_id_leccion, (err, leccion) => {
      if (err) return reject(err)
      if (!leccion) return reject('no se encontro leccion')
      return resolve(leccion)
    })
  })
}

function leccionTerminada(paralelo, id_leccion) {
  LeccionModel.leccionTerminada(id_leccion, (err, res) => {
    if (err) return console.log(err);
    console.log('leccion terminado ' + id_leccion);
  })
  ParaleloModel.leccionTerminada(paralelo._id, (err, res) => {
    if (err) return console.log(err);
    console.log('leccion terminada ' + paralelo._id);
  })
  var promises = []
  paralelo.estudiantes.forEach(estudiante => {
    promises.push(new Promise((resolve, reject) => {
      EstudianteModel.leccionTerminada(estudiante._id, (err, e) => {
        if (err) return reject(err)
        return resolve(true)
      })
    }))
  })
  Promise.all(promises).then(values => {
    console.log('terminado leccion estudiantes');
  }, fail => {
    console.log(fail);
  })

}

// Reemplazar por co
// function run(generator) {
//   const iterator = generator()
//   const iteration = iterator.next()
//   const promise = iteration.value
//   promise.then(x => {
//     const anotherIterator = iterator.next(x)
//     const anotherPromise = anotherIterator.value
//     anotherPromise.then(y => iterator.next(y))
//   })
// }