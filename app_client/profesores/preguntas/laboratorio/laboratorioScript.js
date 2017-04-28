var laboratorio = new Vue({
	el: '#laboratorio',
	data: {
		laboratorios: [],
		preguntas: [],
		profesor: {}
	},
	mounted: function(){
		$('.button-collapse').sideNav();
		$(".dropdown-button").dropdown({ hover: false });
		$('.scrollspy').scrollSpy();
		$('#modalEliminarPregunta').modal();
		$('#modalNuevoLab').modal();
		this.getPreguntas();
		this.obtenerLogeado();
	},
	methods: {
		nuevaPregunta: function(){
			window.location.href = '/profesores/preguntas/nueva-pregunta'

		},
		eliminarPregunta: function(id){
			var url = '/api/preguntas/' + id;
			this.$http.delete(url).then(response => {
				console.log(response)
				//ELIMINAR LA PREGUNTA DE SELF.CAPITULOS
				self.laboratorios = [];
				self.preguntas = [];
				this.getPreguntas();
			}, response => {
				//error callback
				console.log(response)
			});
			
		},
		nuevoLab: function(event){
			var nombreLab = $('#nombreLab').val();
			var idLab = nombreLab.replace(/\s+/g, '');
			var hrefLab = '#' + idLab;
			//console.log(nombreLab)
			//console.log(idLab)
			//console.log(hrefLab)
			var laboratorio = {
				nombre: nombreLab,
				id:  idLab,
				href: hrefLab,
				preguntas: []
			}
			console.log(laboratorio)
			this.laboratorios.push(laboratorio)
		},
		crearModalEliminarPregunta: function(id){
			var self = this;
			var preguntaId = id;
			//Primero hay que eliminar el modal-content. Sino cada vez que abran el modal se añadirá un p más
			$('#modalEliminarPreguntaContent').empty();
			//Ahora si añadir las cosas
			var modalContentH4 = $('<h4/>').addClass('center-align').text('Eliminar');
			var modalContentP = $('<p/>').text('Seguro que desea eliminar la pregunta: ' + preguntaId)
			modalContentP.addClass('center-align')
			$('#modalEliminarPreguntaContent').append(modalContentH4, modalContentP);
			//Lo mismo con el footer
			$('#modalEliminarPreguntaFooter').empty();
			var btnEliminar = $('<a/>').attr({
				'href': '#!',
				'class': 'modal-action modal-close waves-effect waves-green btn-flat'
			});			
			btnEliminar.text('Eliminar');
			btnEliminar.click(function(){
				self.eliminarPregunta(preguntaId);
			})
			var btnCancelar = $('<a/>').attr({
				'href': '#!',
				'class': 'modal-action modal-close waves-effect waves-green btn-flat'
			});
			btnCancelar.text('Cancelar');
			$('#modalEliminarPreguntaFooter').append(btnEliminar, btnCancelar)
			$('#modalEliminarPregunta').modal('open');
		},
		getPreguntas: function(){
			var self = this;
			var flag = false;
			this.$http.get('/api/preguntas').then(response => {
				//success callback				
				self.preguntas = response.body.datos;		//Se almacenarán temporalmente todas las preguntas de la base de datos
				$.each(self.preguntas, function(index, pregunta){
					pregunta['show'] = true;
					if (pregunta.tipoLeccion.toLowerCase()=='laboratorio') {
						$.each(self.laboratorios, function(index, laboratorio){
							if (laboratorio.nombre.toLowerCase()==pregunta.laboratorio.toLowerCase()) {
								laboratorio.preguntas.push(pregunta);
								flag = true;	//Cambia la bandera indicando que encontro el laboratorio
								return false;
							}else{
								flag=false;
							}
						});
						if (!flag) {
							self.crearLaboratorio(pregunta)
						}
					}
				})
			}, response => {
				//error callback
				console.log(response)
			})
		},
		crearLaboratorio: function(pregunta){
			var self = this;
			var nombreLaboratorio = pregunta.laboratorio;
			var idLaboratorio = nombreLaboratorio.toLowerCase();
			idLaboratorio = idLaboratorio.split(":")[0];
			idLaboratorio - idLaboratorio.replace(/\s+/g, '');
			var hrefLaboratorio = '#' + idLaboratorio;
			var laboratorio = {
				nombre: nombreLaboratorio,
				id:  idLaboratorio,
				href: hrefLaboratorio,
				preguntas: []
			}
			laboratorio.preguntas.push(pregunta);
			self.laboratorios.push(laboratorio);
		},
		checkCreador: function(pregunta){
			var self = this;
			//if(pregunta.creador=='') return true;
			if(pregunta.creador==self.profesor._id) return true;
			return false
		},
		obtenerLogeado: function() {
      var self = this;
      this.$http.get('/api/session/usuario_conectado').
        then(res => {
          if (res.body.estado) {
          	self.profesor = res.body.datos;
          }
        });
    }
	}
});

$('body').on("click", '#btnLabNuevo', function(){
	//console.log('Esto va a funcionar carajo');
	//console.log($(this).attr('id'))
	$('#modalNuevoLab').modal('open');
})

document.addEventListener("DOMContentLoaded", function(event) {
  $.get({
    url: "/../navbar/profesores",
    success: function(data) {
      document.getElementById('#navbar').innerHTML = data;
      $(".button-collapse").sideNav();
      $(".dropdown-button").dropdown();
    }
  })
});