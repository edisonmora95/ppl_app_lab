var App = new Vue({
	el: '#app',
	created: function(){
		this.getLeccion();
		this.getEstudiante();
	},
	mounted: function(){
		//Inicializadores de materialize
    $('.button-collapse').sideNav();
    $(".dropdown-button").dropdown({ hover: false });
    $('.scrollspy').scrollSpy();
    $('.modal').modal();
    $('.tooltipped').tooltip({delay: 50});
    //Navbar
    $.get({
      url: "/navbar/profesores",
      success: function(data) {
        document.getElementById('#navbar').innerHTML = data;
        $(".button-collapse").sideNav();
        $(".dropdown-button").dropdown();
      }
    });
	},
	data: {
		leccion: {},
		grupo: '',
		preguntas: [],
		leccionId: '',
		estudianteId: '',
		estudiante: {},
		registroCalificacion: {},
		calificacionTotal: 0,
		calificacionPonderada: 0.00
	},
	methods: {
		/*
			@Descripción: Carga la lección a recalificar
		*/
		getLeccion: function(){
			var self = this;
			self.leccionId = window.location.href.toString().split('/')[6];
			self.estudianteId = window.location.href.toString().split('/')[7];
			self.grupo = window.location.href.toString().split('/')[8];
			var obtenerLeccionURL = '/api/lecciones/recalificar/'+ self.leccionId;

			$.get({
				url: obtenerLeccionURL,
				success: function(res){
					self.leccion = res.datos;
					console.log(self.leccion);
					//Ordenar las preguntas
					self.leccion.preguntas.sort(function(p1, p2){
						return ( (p1.ordenPregunta < p2.ordenPregunta) ? -1 : ( (p1.ordenPregunta > p2.ordenPregunta) ? 1 : 0) );
					});
					//Una vez obtenidas las respuestas, suma las calificaciones dadas
					$.when($.ajax(self.getRespuestas())).then(function(){
						self.sumarCalificaciones();
					});
					//Obtiene la calificación total de la lección
					self.getRegistroCalificacion();
				}
			});

		},
		/*
			@Descripción:
				Obtiene las respuestas del estudiante a cada pregunta de la lección.
		*/
		getRespuestas: function(){
			var self = this;
			$.each(self.leccion.preguntas, function(index, pregunta){
				var preguntaId = pregunta.pregunta._id;
				var obtenerRespuestaURL = '/api/respuestas/buscar/leccion/'+ self.leccionId+ '/pregunta/'+preguntaId+ '/estudiante/'+ self.estudianteId;
				$.get({
					url: obtenerRespuestaURL,
					success: function(res){
						//Las preguntas que el estudiante no respondió no se guardan
						if(res.estado && res.datos!=null){
							pregunta.pregunta.respuesta = res.datos;
							pregunta.pregunta.respuesta.calificacionPonderada = 0;
						}
						if(res.estado && res.datos==null){
							//Si el estudiante no respondió la pregunta, la calificación es 0 automáticamente
							self.bloquearInput(pregunta.pregunta._id);
							self.bloquearTextArea(pregunta.pregunta._id);
							self.bloquearBtnResponder(pregunta.pregunta._id);
						}
						//Ponderar las calificaciones a 0, 1 ó 2
						var puntajePregunta = pregunta.pregunta.puntaje;
						var calificacionPregunta = pregunta.pregunta.respuesta.calificacion;
						var calificacionPonderadaPregunta = (calificacionPregunta / puntajePregunta) * 2;

						pregunta.pregunta.respuesta.calificacionPonderada = calificacionPonderadaPregunta;
						
						self.preguntas.push(pregunta);
						
						//Ordeno las preguntas
						self.preguntas.sort(function(p1, p2){
							return ( (p1.ordenPregunta < p2.ordenPregunta) ? -1 : ( (p1.ordenPregunta > p2.ordenPregunta) ? 1 : 0) );
						});
					}
				});
			});
		},
		/*
			@Descripción: Obtiene los datos del estudiante al que se le está recalificando la lección.
		*/
		getEstudiante: function(){
			var self = this;
			var obtenerEstudianteURL = '/api/estudiantes/' + self.estudianteId;
			$.get({
				url: obtenerEstudianteURL,
				success: function(res){
					self.estudiante = res.datos;
				}
			});
		},
		/*
			@Descripción: Obtiene la nota de calificación de esta lección.
		*/
		getRegistroCalificacion: function(){
			var self = this;
			var urlApi = '/api/calificaciones/' + self.leccionId + '/' + self.grupo;
			$.get({
				url: urlApi,
				success: function(res){
					self.registroCalificacion = res.datos[0];
					self.calificacionPonderada = self.registroCalificacion.calificacion;
				}
			});
		},
		//Eventos
		enviarCalificacion: function(){
			var self = this;
			var urlApi = '/api/calificaciones/recalificar/leccion/' + self.leccionId + '/grupo/' + self.grupo;
			$.ajax({
				method: 'PUT',
				url: urlApi,
				data: {
					calificacion: self.calificacionPonderada,
					estudiante: self.estudianteId
				},
				success: function(res){
					if(res.estado){
						$('#myModal').modal('open');
					}else{
						$('#modalErrorLeccion').modal('open');
					}
				}
			});
		},
		regresar: function(){
			window.location.href = '/profesores/leccion/recalificar/grupos/' + self.grupo;
		},
		recalificar: function(pregunta){
			console.log(pregunta)
			var self = this;
			var urlApi = '/api/respuestas/calificar/leccion/' + self.leccionId + '/pregunta/' + pregunta._id + '/grupo/' + self.grupo;

			var calificacionId = '#calificacion-' + pregunta._id
			var calificacionPregunta = $(calificacionId).val();

			var feedbackId = '#feedback-' + pregunta._id;
			var feedbackPregunta = $(feedbackId).val();

			var puntajePregunta = parseInt(pregunta.puntaje);

			var calificacionPreguntaPonderada = ( (calificacionPregunta * puntajePregunta) / 2 );

			if (calificacionPregunta > 2 || calificacionPregunta < 0) {
				Materialize.toast('La calificación debe estar entre 0 y 2. Vuelva a calificar.', 5000, 'red darken-4 rounded');
				return false;
			}
			console.log(calificacionPreguntaPonderada)
			console.log(feedbackPregunta)
			$.ajax({
				method: 'PUT',
				url: urlApi,
				data: {
					calificacion: calificacionPreguntaPonderada,
					feedback: feedbackPregunta
				},
				success: function(res){
					if(res.estado){
						pregunta.respuesta.calificacion = calificacionPreguntaPonderada;
						self.sumarCalificaciones();
						Materialize.toast('¡Su calificación ha sido enviada!', 1000, 'rounded');
					}
				}
			});
		},
		sumarCalificaciones: function(){
			var self = this;
			self.calificacionTotal = 0;
			$.each(self.preguntas, function(index, pregunta){
				self.calificacionTotal += parseInt(pregunta.pregunta.respuesta.calificacion);
			});
			self.ponderarCalificacionLeccion();
		},
		ponderarCalificacionLeccion: function(){
			this.calificacionPonderada = parseFloat( ( this.calificacionTotal * 100 ) / this.leccion.puntaje ).toFixed(2);
		},
		bloquearTextArea: function(preguntaId){
			var self = this;
			var textareaId = '#feedback-' + preguntaId;
			$(textareaId).attr('disabled', true);
		},
		bloquearBtnResponder: function(preguntaId){
			var self = this;
			var btnId = '#btn-' + preguntaId;
			$(btnId).attr('disabled', true);
		},
		bloquearInput: function(preguntaId){
			var self = this;
			var inputId = '#calificacion-' + preguntaId;
			$(inputId).attr('disabled', true);
		},
	}
});