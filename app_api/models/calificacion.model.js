const mongoose = require('mongoose');
const shortid = require('shortid');
mongoose.Promise = global.Promise;
const paralelo = require('../models/paralelo.model');

const CalificacionSchema = mongoose.Schema({
	_id: {
		type: String,
		unique: true,
		'default': require('shortid').generate
	},
	leccion: {
		type: String,
		ref: 'Leccion'
	},
	leccionTomada: {
		type: Boolean
	},
	grupo: {
		type: String,
		ref: 'Grupo'
	},
	nombreGrupo: {
		type: String
	},
	paralelo : {
		type: String,
		ref: 'Paralelo'
	},
	nombreParalelo: {
		type: String
	},
	participantes: [{
			type: String,
			ref: 'Estudiante'
	}],
	calificacion: {
		type: Number
	},
	calificada: {
		type: Boolean
	},
	estudianteCalificado: {
		type: String,
		ref: 'Estudiante'
	}
},{timestamps: true, versionKey: false, collection: 'calificaciones'});

CalificacionSchema.methods.crearRegistro = function(callback){
	this.save(callback);
}

CalificacionSchema.statics.obtenerRegistro = function(id_leccion, id_grupo, callback){
	this.find({leccion: id_leccion, grupo: id_grupo}, callback);
}

CalificacionSchema.statics.anadirParticipante = function(id_leccion, id_grupo, id_estudiante, callback){
	this.update({leccion: id_leccion, grupo: id_grupo}, {$addToSet: {participantes: id_estudiante}}, callback);
}

CalificacionSchema.statics.calificar = function(id_leccion, id_grupo, calificacion_nueva, estudiante, callback){
	this.update({leccion: id_leccion, grupo: id_grupo}, {calificacion: calificacion_nueva, calificada: true, estudianteCalificado: estudiante}, callback);
}

CalificacionSchema.statics.obtenerRegistroPorLeccion = function(id_leccion, callback){
	//this.find({leccion: id_leccion}, callback);
	this.find({leccion: id_leccion})
				.populate('participantes', '_id nombres apellidos')
				.populate('grupo', 'nombre')
				.exec(callback);
}

CalificacionSchema.statics.obtenerRegistroPorLeccionCsv = function(id_leccion, callback){
	//this.find({leccion: id_leccion}, callback);
	this.find({leccion: id_leccion}).populate({path: 'participantes grupo'}).exec(callback);
}

CalificacionSchema.statics.obtenerRegistroPorParalelo = function(id_paralelo, callback){
	//this.find({leccion: id_leccion}, callback);
	this.find({paralelo: id_paralelo}).populate({path: 'leccion grupo'}).exec(callback);
}

CalificacionSchema.statics.obtenerRegistroPorParaleloCsv = function(id_paralelo, callback){
	//this.find({leccion: id_leccion}, callback);
	this.find({paralelo: id_paralelo, calificada: true}).populate({path: 'leccion grupo'}).exec(callback);
}

// De alguna manera no encuentra la id y devuelve vacio
CalificacionSchema.statics.obtenerRegistroPorGrupo = function(id_grupo, callback){
	this.find({grupo: id_grupo}, callback);
}

CalificacionSchema.statics.anadirNombreGrupo = function(id_grupo, nombre_grupo, callback){
	this.update({grupo: id_grupo}, {nombreGrupo: nombre_grupo},{multi: true}, callback)
}

CalificacionSchema.statics.obtenerTodos = function(callback){
	this.find({}, callback);
}



module.exports = mongoose.model('Calificacion', CalificacionSchema);
