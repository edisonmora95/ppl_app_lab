var App = new Vue({
  el: '#app',
  mounted: function(){
    this.obtenerLogeado();
    this.obtenerLeccion();
    $('ul.tabs').tabs();
  },
  data: {
    estudiante: {},
    leccion: {},
    feedback:[],
    preguntas: [],
    calificacion:[],
    grupos: []
  },
  methods: {
    tomarLeccion : function(){
        window.location.href = '/estudiantes/tomar-leccion'
    },
    obtenerLogeado: function() {
      var self = this;
      this.$http.get('/api/session/usuario_conectado').
        then(res => {
          if (res.body.estado) {
            self.estudiante = res.body.datos;
            var grupo = this.obtenerGrupoDeEstudiante(self.estudiante)
          }
        });
    },
    obtenerLeccion: function(){
      var self = this;
      path = window.location.pathname;
            
      //Break the path into segments
      segments = path.split("/");
      url = '/api/lecciones/' + segments[3]
      this.$http.get(url).
        then(res => {
          if (res.body.estado) {
            self.leccion = res.body.datos;
          }
        }); 
    },
    obtenerGrupoDeEstudiante: function(estudiante){
      var self = this;
      var url = '/api/grupos/estudiante/'
      url = url + estudiante._id;
      this.$http.get(url).then(response => {
        //Success callback
	    $.each(this.leccion.preguntas, function(index, value){
	   	  self.obtenerRespuestas(response.body.datos._id, self.leccion._id, value.pregunta);
	      self.obtenerPregunta(value.pregunta);
	    })    
      }, response => {
        //Error callback
      });    
    },
    obtenerRespuestas: function(grupo_id, leccion_id, pregunta_id){
      var url = '/api/respuestas/buscar'
      var self = this;
      var param = {
        grupo: grupo_id,
        leccion: leccion_id,
        pregunta: pregunta_id
      }
      this.$http.post(url, param).then(response => {
        //success callback
        if(response.body.datos)
	        this.obtenerFeedback(response.body.datos);
	        this.obtenerCalificacion(response.body.datos);
	        this.grupos.push(response.body.datos);
        }, response => {
        //error callback
        console.log(response)
      });
    },
    //Esta función pide como parámetro el array de respuesta de cada pregunta, para poder llenar una data de feedback
    obtenerFeedback: function(respuestasPorPregunta){
      var self = this;
      $.each(respuestasPorPregunta, function(index, value){
        //En teoría el feedback es sólo para una persona
        if(index == 0 && value.feedback != ""){
          	self.feedback.push(value.feedback);
          	return;
        }
      })
      self.feedback.push("No hay feedback que mostrar");
    },
    obtenerCalificacion: function(respuestasPorPregunta){
      var self = this;
      var temp, tempCmp;
      $.each(respuestasPorPregunta, function(index, value){
        if (index == 0)
          self.calificacion.push(value.calificacion);
      })
    },
    obtenerPregunta: function(pregunta_id){
      //Esta función retorna el título y descripción de la pregunta
      /*
        Esta función es una tontera, pero lo que hace es cambiar un poco el objeto de grupos,
        ahora la opción de 'contestado' contará con un objeto con la información total de la
        pregunta. Es colocado en el index 0 porque ese es el que siempre existirá. Otro método
        que sea aplicado ya actualizado será agradecido
      */
      var url = '/api/preguntas/'
      var self = this;
      var pregunta = {
           capitulo       :     '',
           descripcion    :     '',
           nombre         :     '',
           tiempoEstimado :     0,
           _id            :     '' 
      }

      url = url + pregunta_id;
      this.$http.get(url).then(response => {
        //success callback
        /*
        pregunta.capitulo       = response.body.datos.capitulo
        pregunta.descripcion    = response.body.datos.descripcion
        pregunta.nombre         = response.body.datos.nombre
        pregunta.tiempoEstimado = response.body.datos.tiempoEstimado
        pregunta._id            = response.body.datos._id
        */
        
        self.preguntas.push(response.body.datos);
        }, response => {
        //error callback
        console.log(response);
      });
    }
  }
})
      //  rkK9Xv8Ax id de la lección para pruebas inmediatas.

//App.leccion_nueva.preguntas

/*
function filtrarPreguntas(elemento){
  for(var x = 0; x < App.leccion_nueva.preguntas.length; x++){
      if(elemento._id == App.leccion_nueva.preguntas[x].pregunta)
        return true;
      }
  return false;
}
*/

//   var selected = App.preguntas.filter(filtrarPreguntas);

/*



*/
        /*
calificacion
contestado
createdAt
estudiante
feedback
grupo
leccion
paralelo
pregunta
respuesta
updatedAt
_id
        */

/*
  nuevo atributo de estudiantes, lecciones. es array de objetos con:
  id_leccion
  calificado
  fechas
  grupo cuando dió la leccion

  for each de lecciones y buscar leccion, 
*/