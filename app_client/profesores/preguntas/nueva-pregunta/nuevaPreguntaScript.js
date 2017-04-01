
var app = new Vue({
	mounted: function(){
		$('.button-collapse').sideNav();
		$('select').material_select();
		$('.chips').material_chip();
		$('.chips-placeholder').material_chip({
		    placeholder: 'Enter a tag',
		    secondaryPlaceholder: 'Enter a Tag',
		});


	},
	el: '#preguntaNueva',
	data: {
		selected: 'sad',
		pregunta: {
			titulo: '',
			tags: [],
			descripcion: '',
			imagenes: [],	//Es opcional añadir imágenes a la pregunta
			tipoPregunta: '',	//V/F, justifiacación u opción múltiple
			opciones: [],		//Se llena solo si tipoPregunta=='Opcion multiplie'
			tipoLeccion: '',	// Lección, tutorial o laboratorio
			tiempoEstimado: 0,
			tiempoBandera: 0,	// Tiempo en que la bandera cambiará de color para el Real Time
			creador: '',		//Se deberia llenar con las sesiones, trabajo de Julio Guilindro
			capitulo: '',		//Se llena solo si tipoLeccion=='leccion'
			tutorial: '',		//Se llena solo si tipoLeccion=='tutorial'
			laboratorio: '',	//Se llena solo si tipoLeccion=='Laboratorio'
			puntaje: 0

		}
	}
});


$('#tipo-leccion').change(function(){ 
	//app.set('select', $('#jurisdiction').val()); 
	//console.log( 'Text: ' + $('#tipo-leccion option:selected').text())
	//console.log('Antes: ' + app.$data.pregunta.tipoLeccion)
	app.$data.pregunta.tipoLeccion = $('#tipo-leccion option:selected').text();
	//console.log('Despues: ' + app.$data.pregunta.tipoLeccion)
});

$('#tipo-pregunta').change(function(){ 
	//app.set('select', $('#jurisdiction').val()); 
	//console.log( 'Text: ' + $('#tipo-pregunta option:selected').text())
	//console.log('Antes: ' + app.$data.pregunta.tipoPregunta)
	app.$data.pregunta.tipoPregunta = $('#tipo-pregunta option:selected').text();
	//console.log('Despues: ' + app.$data.pregunta.tipoPregunta)
});