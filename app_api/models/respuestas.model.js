const mongoose = require('mongoose');
const shortid = require('shortid');
mongoose.Promise = global.Promise;

const respuestasSchema = mongoose.Schema({
	_id: {
		type: String,
		unique: true,
		'default' : shortid.generate
	},
  estudiante: {
    type: String,
    ref: 'Estudiante'
  },
  leccion: {
    type: String,
    ref: 'Leccion'
  },
  pregunta: {
    type: String,
    ref: 'Pregunta'
  },
  paralelo: {
    type: String,
    ref: 'Paralelo'
  },
  grupo: {
    type: String,
    ref: 'Grupo'
  },
	contestado: {
    type: Boolean,
    'default': false
  },
  respuesta: {
    type: String
  },
  fechaEmpezado: {
    type: Date
  },
  fechaTerminado: {
    type: Date
  },
  calificacion: {
    type: Number
  },
	feedback: {
		type: String
	},
  imagenes:{
    type: String
  }
}, {versionKey: false, timestamps: true, collection: 'respuestas'})

respuestasSchema.methods.crearRespuesta = function(callback){
  this.save(callback);
}

respuestasSchema.statics.obtenerRespuestasPorGrupoAPregunta = function(id_leccion, id_pregunta, id_grupo, callback){
  this.find({$and: [{leccion:id_leccion}, {pregunta:id_pregunta}, {grupo:id_grupo}]}, callback);
}

respuestasSchema.statics.obtenerRespuestaDeEstudiante = function(id_leccion, id_pregunta, id_estudiante, callback){
  this.findOne({$and: [{leccion:id_leccion}, {pregunta:id_pregunta}, {estudiante:id_estudiante}]}, callback);
}

respuestasSchema.statics.obtenerRespuestasDeEstudianteRecalificacion = function(id_leccion, id_estudiante, callback){
  //this.find({$and: [{leccion:id_leccion}, {estudiante:id_estudiante}]}, callback);
  this.find({$and: [{leccion:id_leccion}, {estudiante:id_estudiante}]})
        .populate('leccion')
        .populate('estudiante')
        .populate('pregunta')
        .exec(callback);
}
respuestasSchema.statics.obtenerRespuestasDeEstudiante = function(id_leccion, id_estudiante, callback){
  this.find({$and: [{leccion:id_leccion}, {estudiante:id_estudiante}]}, callback);
}

respuestasSchema.statics.actualizarRespuesta = function(id_respuesta, actualizar, callback){
  this.update({_id:id_respuesta}, {$set : {respuesta: actualizar}}, callback);
}

respuestasSchema.statics.obtenerRespuestaPorId = function(id_respuesta, callback){
  this.findOne({_id: id_respuesta}, callback);
}

respuestasSchema.statics.calificarRespuestaGrupal = function(id_leccion, id_pregunta, id_grupo, calificacion_nueva, feedback_nuevo, callback){
  //Busca en la colección a todas las respuestas del grupo dado a la pregunta dada de la lección dada
  //Actualiza el valor de la calificación de todas las respuestas encontradas (todas las respuestas del grupo) a valor de la nueva calificación
  //Actualiza el valor del feedback
  this.update({leccion: id_leccion, pregunta: id_pregunta, grupo: id_grupo}, {$set: {calificacion: calificacion_nueva, feedback: feedback_nuevo}}, { multi: true }, callback);
}

module.exports = mongoose.model('Respuesta', respuestasSchema);
