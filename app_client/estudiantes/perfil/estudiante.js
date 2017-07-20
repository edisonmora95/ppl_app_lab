if (window.Promise) {
  console.log('soporta promise');
} else {
  console.log('no soporta promise');
}



var app = new Vue({
  el: '#app',
  mounted: function(){
    this.obtenerLogeado();
  },
  data: {
    estudiante: {},
    lecciones: []
  },
  methods: {
    obtenerLogeado: function() {
      var self = this;
      $.get({
        url: '/api/session/usuario_conectado',
        success: function(res) {
          console.log(res.estado);
          if (res.estado) {
            self.estudiante = res.datos;
            self.presentarLecciones();
          }
        }
      })
    },
    
    presentarLecciones: function(){
      var self = this;
      $.each(self.estudiante.lecciones, function(index, leccion){
        //Existía un bug que mostraba lecciones sin referencia a la lección que pertenecía. Esta validación es para no mostrar eso
        if(leccion.leccion!=null){
          self.lecciones.push(leccion);
        }
      })
    },moment: function (date) {
      return moment(date);
    },
    date: function (date) {
      return moment(date).format('MMMM Do YYYY');
    },
    tomarLeccion : function(){
        window.location.href = '/estudiantes/tomar-leccion'
    },
    verLeccion: function(event){
      leccion = event.currentTarget.id;
      window.location.href = '/estudiantes/ver-leccion/' + leccion;
    }
  }
});

