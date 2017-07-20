var appRecalificar = new Vue({
	el: '#appRecalificar',
	created: function(){
    this.profesorLogeado();
    this.obtenerRegistrosCalificaciones();
  },
	mounted: function(){
		//Inicializadores de Materialize
    $('.button-collapse').sideNav();
    $(".dropdown-button").dropdown({ hover: false });
    $('select').material_select();
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
		profesor: {},
		registros: [],    //Registros de las calificaciones de todos los grupos de la lección a recalificar
		grupoSeleccionado: {},    //Grupo seleccionado para recalificar la lección
    estudianteEscogido: {}    //Estudiante seleccionado para recalificar la lección
	},
	methods:{
    /*
      @Descripción: 
        Obtengo la sesión del usuario conectado, en este caso es un profesor, y la guardo en self.profesor
    */
		profesorLogeado: function() {
      var self = this;
      $.get({
        url: '/api/session/usuario_conectado',
        success: function(res){
          if (res.estado) {
            self.profesor = res.datos;
          }
        }
      });
		},
    /*
      @Descripción:
        Obtengo los registros de calificación de cada grupo de la lección en la que estoy.
        Los almaceno en self.registros
        
    */
		obtenerRegistrosCalificaciones: function(){
      var self = this;
      var pathname = window.location.pathname;
      var idLeccion = pathname.split('/')[5];
      var urlApi = '/api/calificaciones/' + idLeccion;
      $.get({
        url: urlApi,
        success: function(res){
          //Gracias a @Joel, tengo que eliminar un registro con grupo NULL...
          self.registros = $.grep(res.datos, function(registro){
            return registro.grupo != null;
          });
          //Ordeno los registros por nombre
          self.registros.sort(function(r1, r2){
            var nombreR1 = r1.grupo.nombre;
            var numeroR1 = parseInt(nombreR1.split(" ")[1]);
            var nombreR2 = r2.grupo.nombre;
            var numeroR2 = parseInt(nombreR2.split(" ")[1]);
            return ((numeroR1 < numeroR2) ? -1 : ((numeroR1 > numeroR2) ? 1 : 0));
          });
        }
      });
    },
    //Eventos
    seleccionarGrupo: function(registro){
      this.grupoSeleccionado = registro;
    },
    seleccionarEstudiante: function(estudiante){
      this.estudianteEscogido = estudiante;
    },
    /*
      @Descripción:
        Redirige a la ventana de recalificación de lección si se ha seleccionado un grupo y un estudiante
    */
    recalificarRedireccion: function(){
      var self = this;
      if (self.estudianteEscogido.nombres != null){
        var leccionId = window.location.href.toString().split('/')[7];
        window.location.href = '/profesores/leccion/recalificar/'+leccionId+'/'+ self.estudianteEscogido._id + '/' + self.grupoSeleccionado.grupo._id;
      }else{
        Materialize.toast('Debe seleccionar a un estudiante para recalificar la lección.', 2000);
      }
    }
	}
});