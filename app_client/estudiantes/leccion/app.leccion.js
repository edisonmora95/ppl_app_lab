// var socket = io({transports: ['websocket']});
// if (window.location.href.toString().split('/')[2] === "ppl-assessment.espol.edu.ec") {
//   var socket = io('ws://ppl-assessment.espol.edu.ec:8000/tomando_leccion', {
//     reconnect: true,
//     // 'connect timeout': 1000,
//     // 'reconnection delay': 2000,
//     // 'max reconnection attempts': 10000,
//     // 'force new connection':true
//   })
// } else {
//   var socket = io('ws://localhost:8000/tomando_leccion', {
//     reconnect: true,
//     'connect timeout': 1000,
//     'reconnection delay': 2000,
//     'max reconnection attempts': 10000,
//     'force new connection':true
//   })
// }

var socket = io('/tomando_leccion', {
    reconnect: true,
    'connect timeout': 1000,
    'reconnection delay': 2000,
    'max reconnection attempts': 10000,
    'force new connection':true
})


var App = new Vue({
  mounted: function(){
    //Inicializaciones de Materializecss
    $('ul.tabs').tabs();
    $('.modal').modal();
    $('.tooltipped').tooltip({delay: 50});
  },
  el: '#app',
  methods: {
    obtenerLogeado: function() {
      var self = this
      $.when($.get({
        url: '/api/estudiantes/leccion/datos_leccion',
        success: function(res) {
          if (res.estado) {
            console.log(res.datos);
            self.estudiante = res.datos.estudiante;
            self.idLeccion = res.datos.estudiante.leccion;
            self.leccion = res.datos.leccion;
            self.estudiante.grupo = res.datos.grupo._id
            var tmp =  res.datos.leccion.preguntas.slice();
            for (var i = 0; i < res.datos.leccion.preguntas.length; i++) {
              self.preguntas.push(tmp[i].pregunta)
            }
            self.respuestas = res.datos.respuestas
            console.log(self.preguntas);
            if (res.datos.respuestas) {
              for (var j = 0; j < self.preguntas.length; j++) {
                for (var i = 0; i < res.datos.respuestas.length; i++) {
                  if (self.preguntas[j]._id ===  res.datos.respuestas[i].pregunta) {
                    self.preguntas[j].respuesta = res.datos.respuestas[i].respuesta;
                    self.preguntas[j].respondida = true;
                    var idTextarea = '#textarea-' + res.datos.respuestas[i].pregunta;
                    $(idTextarea).val(res.datos.respuestas[i].respuesta);
                    break;
                  }
                  if ( (i + 1) == res.datos.respuestas.length) {
                    self.preguntas[j].respuesta = '';
                    self.preguntas[j].respondida = false;
                  }
                }
              }
            }
            self.estudiante.paralelo = res.datos.paralelo._id;
            if (!res.datos.paralelo.dandoLeccion) {
              window.location.href = '/estudiantes'
            }
            socket.emit('usuario', res.datos.estudiante);
          }
        }
      })).then(function() {
        self.anadirRespuestas()
      })
    },
    anadirRespuestas: function() {
       // var self = this;
       this.respuestas.forEach(function(res) {
         var idTextarea = '#textarea-' + res.pregunta;
         $(idTextarea).val(res.respuesta);
       })
     },
     crearPregunta: function(res){
       /*
         Esta función toma la información de una pregunta obtenida de la base y la mete en un objeto Pregunta para mostrarlo.
       */
       //console.log('Entrando a crearPregunta')
       var self = this;
       var pregunta = res.datos;   //Objeto pregunta obtenido como respuesta de la llamada a la base de datos.
       //self.crearEditor(pregunta);
       pregunta.respuesta = ''
       //Busca si la pregunta ya fue respondida, busca en la base de datos si existe una respuesta del estudiante a la pregunta escogida
       var url = '/api/respuestas/buscar/leccion/' + self.leccion._id + '/pregunta/' + pregunta._id + '/estudiante/' + self.estudiante._id;
       $.ajax({
         url: url,
         method: 'GET',
         success: function(response) {
           if(response.datos != null) {          //Si la respuesta existe. Entonces la pregunta se marca como respondida
             pregunta.respuesta = response.datos.respuesta;
             //var idEditor = '#editor-' + pregunta._id;
             //$(idEditor).code(response.datos.respuesta); //Inserto la respuesta en el editor de texto.

             pregunta.respondida = true;
           }else{                                    //Si la respuesta no existe entonces la pregunta se marca como no respondida
             pregunta.respuesta = '';
             pregunta.respondida = false;
           }
         },
         error: function() {
           pregunta.respuesta = '';
           pregunta.respondida = false;
         }
       })
       return pregunta;
     },
     crearEditor: function(pregunta){
       /*
         @Descripción: Esta función inicializa el editor de texto.
       */
       //console.log('Entrando a la funcion crearEditor')
       var self = this;
       $.each(self.preguntas, function(index, pregunta){
         var idEditor = '#editor-' + pregunta._id;
         $(idEditor).materialnote({
           height: "25vh",
           toolbar: [
             // [groupName, [list of button]]
             ['style', ['bold', 'italic', 'underline']],
             ['para', ['ul', 'ol']],
             ['Insert', ['picture']]
           ],
           onImageUpload: function(files, editor, $editable) {
             var clientId = "300fdfe500b1718";
             var xhr = new XMLHttpRequest();
             xhr.open('POST', 'https://api.imgur.com/3/upload', true);
             xhr.setRequestHeader('Authorization', 'Client-ID ' + clientId);
             App.loading(true);
             xhr.onreadystatechange = function () {
               if (xhr.status === 200 && xhr.readyState === 4) {
                 App.loading(false);
                 var url = JSON.parse(xhr.responseText)
                 $(idEditor).materialnote('editor.insertImage', url.data.link);
               }
             }
             xhr.send(files[0]);
           }
         });
         $(".note-editor").find("button").attr("type", "button");
       });

     },
     loading: function(estado){
       //función que indicará que una foto se está subiendo (si tuviera lo alto y ancho podría simular a la foto en sí.)
       //Requiere el estado, si está cargando algo o no.
       if (estado){
         $(".note-editable").append('<div class="preloader-wrapper big active onLoad"></div>');
         $(".onLoad").append('<div class="spinner-layer spinner-blue-only load-2"></div>');
         $(".load-2").append('<div class="circle-clipper left load-3"></div>');
         $(".load-3").append('<div id="load-4" class="circle"></div>');
       }else{
         $("#onLoad").remove();
         $("div").remove(".onLoad");
       }
     },
     //Eventos
     responder: function(pregunta, event){
       /*
         Función ejecutada al dar click en btn responder de cada pregunta.
         Hay 3 posibles casos cuando el estudiante quiere responder:
           * Primera vez que el estudiante responde la pregunta y no puede corregir todavía.
           * La pregunta ya fue respondida y puede corregirla.
           * Aún no tiene habilitado para corregir y quiere corregir la respuesta enviada.
       */
       var self = this;
       //Durante la leccion, mientras está respondiendo una pregunta y aún quedan más por responder
       if(!pregunta.respondida&&!self.corregirHabilitado){
         self.enviarRespuesta(pregunta);
       }
       //Después de haber respondido todas las preguntas, si quiere corregir alguna
       else if(pregunta.respondida&&self.corregirHabilitado){
         self.corregirRespuesta(pregunta);
       }
       //Durante la lección, si aún no ha respondido todas las preguntas y quiere volver a enviar una respuesta
       else{
          $('#modalCorregirRespuesta').modal('open');
       }
     },
     enviarRespuesta: function(pregunta){
       /*
         Función que se ejecutará para enviar una respuesta por primera vez
       */
       var self = this;
       var respuesta = self.crearRespuesta(pregunta);  //Se crea el objeto Respuesta que se enviará a la base de datos
       var url = '/api/respuestas/';
       $.ajax({
         url: url,
         method: 'POST',
         data: respuesta,
         success: function(response) {
           if (response.estado) {
             // var $toastContent = $('<h3>¡Su respuesta ha sido enviada!</h3>');
             Materialize.toast('¡Su respuesta ha sido enviada!', 6000, 'rounded');
             pregunta.respondida = true; //Marco que la pregunta ha sido respondida, para que no pueda corregirla hasta que termine la lección.
             self.bloquearBtnRespuesta(pregunta); //Bloqueo el btn de reponder para que no pueda volver a enviar su respuesta, hasta que termine la lección.
             self.bloquearTextAreaRespondida(pregunta); //Bloqueo el textarea de la respuesta para que no pueda editarla hasta que termine la lección.
             //self.bloquearEditor(pregunta);
             if(self.verificarTodasRespondidas()){
               //Si ya ha enviado todas las respuestas, entonces se mostrará el modal preguntando si quiere corregir alguna pregunta o terminar la lección.
               $('#modalRevisarRespuestas').modal('open');
             }
           }
         },
         error: function(response) {
           Materialize.toast('¡Algo ha pasado!, no hemos podido enviar su respuesta', 1000, 'rounded')
           console.log('Error al tratar de enviar la respuesta... De alguna forma esto es culpa de Xavier Idrovo');
           console.log(response);
         }
       })
     },
     crearRespuesta: function(pregunta){
       /*
         @Descripción: Esta función crea el objeto Respuesta que se enviará a la base de datos.
         @Autor: @edisonmora95
         @FechaModificación: 24-05-2017 @edisonmora95
       */
       var self = this;
       //var idEditor = '#editor-' + pregunta._id; //Obtengo el id del editor en el que se encuantra la respuesta que se desea enviar.
       //var respuestaEditor = $(idEditor).code() //Obtengo la respuesta escrita
       var idTextarea = '#textarea-' + pregunta._id;
       var respuestaTextarea = $(idTextarea).val();
       var idSrcImage = '#source_image-' + pregunta._id;
       var urlImagen = $(idSrcImage).attr('aux');


       var respuesta = {
         estudiante: self.estudiante._id,
         leccion: self.leccion._id,
         pregunta: pregunta._id,
         paralelo: self.estudiante.paralelo,
         grupo: self.estudiante.grupo,
         contestado: true,
         respuesta: respuestaTextarea,
         feedback: '',
         calificacion: 0,
         imagenes: urlImagen
       }
       console.log(respuesta)
       return respuesta;
     },
     bloquearBtnRespuesta: function(pregunta){
       var btnId = '#btn-responder-' + pregunta._id
       $(btnId).attr("disabled", true);
     },
     bloquearTextAreaRespondida: function(pregunta){
       var textAreaId = "#textarea-" + pregunta._id;
       $(textAreaId).attr("disabled", true);
     },
     bloquearEditor: function(pregunta){
       //TODO
     },
     verificarTodasRespondidas: function(){
       /*
         Esta función verifica si el estudiante ha respondido todas las preguntas de la lección
       */
       //console.log('Se van a revisar las preguntas')
       var self = this;
       var todasRespondidas = true;
       $.each(self.preguntas, function(index, pregunta){
         //console.log('Revisando pregunta: ')
         //console.log(pregunta)
         if(!pregunta.respondida){
           //console.log('La pregunta no fue respondida: ')
           //console.log(pregunta)
           todasRespondidas = false;
           return false;
         }
       });
       return todasRespondidas;
     },
     revisarLeccion: function(){
       /*
         Función del modal. Si el estudiante escoge la opción de corregir respuestas
       */
       var self = this;
       self.corregirHabilitado = true; //Se habilita la opción de corregir las respuestas enviadas.
       $.each(self.preguntas, function(index, pregunta){
         //Se vuelven a habilidar los botones y las textareas de todas las preguntas para poder corregir
         self.desbloquearBtnRespuesta(pregunta);
         self.desbloquearTextAreaRespondida(pregunta);
       });
     },
     desbloquearTextAreaRespondida: function(pregunta){
       var textAreaId = "#textarea-" + pregunta._id;
       $(textAreaId).attr("disabled", false);
     },
     desbloquearEditor: function(pregunta){
       //TODO
     },
     desbloquearBtnRespuesta: function(pregunta){
       var btnId = "#btn-responder-" + pregunta._id;
       $(btnId).attr("disabled", false);
     },
     corregirRespuesta: function(pregunta){
       /*
         @Descripcion: Esta función se ejecutará cuando el estudiante quiera responder una pregunta que ya fue respondida y tenga habilitada la opción para responder preguntas.
         @Autor: @edisonmora95
         @ÚltimaMidificación: 21-05-2017 @edisonmora95
       */
       var self = this;
       //Primero busco en la base de datos si la pregunta que quiere corregir ya fue respondida
       var url = "/api/respuestas/buscar/leccion/" + self.leccion._id + "/pregunta/" + pregunta._id + "/estudiante/" + self.estudiante._id
       $.ajax({
         url: url,
         method: 'GET',
         success: function(response) {
           //Si se encuentra la respuesta, se hace la llamada a la api para corregirla.
           var idRespuesta = response.datos._id;
           self.enviarCorreccion(idRespuesta, pregunta);
         }
       })
     },
     enviarCorreccion: function(idRespuesta, pregunta){
       /*
         Esta función hace la llamada a la api para corregir la respuesta.
       */
       var urlPut = "/api/respuestas/" + idRespuesta;
       //var idEditor = '#editor-' + pregunta._id; //Obtengo el id del editor en el que se encuantra la respuesta que se desea enviar.
       //var respuestaEditor = $(idEditor).code() //Obtengo la respuesta escrita
       var idTextarea = '#textarea-' + pregunta._id;
       var respuestaTextarea = $(idTextarea).val();
       var resp = {respuesta: respuestaTextarea}
       //var resp = {respuesta: respuestaEditor}
       $.ajax({
         url: urlPut,
         method: 'PUT',
         data: resp,
         success: function(response) {
           Materialize.toast('¡Su respuesta ha sido corregida!', 6000, 'rounded');
         },
         error: function(response) {
           console.log(response);
           Materialize.toast('Hubo un error al tratar de corregir su respuesta.', 1000, 'rounded');
           //alert('Hubo un error al enviar la corrección. De alguna forma esto es culpa de Xavier')
         }
       })
     },
     responderTodas: function(){
       /*
         Esta función se ejecuta cuando el tiempo se ha terminado, automáticamente se envían todas las respuestas.
       */
       var self = this;
       $.each(self.preguntas, function(index, pregunta){
         if(!pregunta.respondida){
           self.responder(pregunta);
         }
       });
       window.location.href = "/estudiantes";
     },
     mostrarModal: function(imageUrl){
       $("#modal_Img .modal-content").empty();
       $("<img>",{'src': imageUrl, 'class' : 'center-block' }).appendTo("#modal_Img .modal-content")
       $('#modal_Img').modal('open');
     },
     mostrarModal: function(imageUrl){
       $("#modal_Img .modal-content").empty();
       $("<img>",{'src': imageUrl, 'class' : 'center-block' }).appendTo("#modal_Img .modal-content")
       $('#modal_Img').modal('open');
     },
     getImage: function(pregunta, event) {
       /*
             @Descripción: Esta función obtiene la imagen subida por el usuario
             @Autor: @edisonmora95, @jguilindro
             @FechaModificación: 18-07-2017 @jguilindro
           */
       var input= event.target;

       if (input.files && input.files[0]) {
         var reader = new FileReader();
         reader.onload = function (e) {
           $('#source_image-'+pregunta).attr('src', e.target.result);
           App.comprimir(pregunta);//Comprime la imagen obtenida
         };
         reader.readAsDataURL(input.files[0]);
       }
     },

     comprimir: function(pregunta){
       /*
               @Descripción: Esta función comprime una imagen subida por el usuario
               @Autor: @edisonmora95, @jguilindro
               @FechaModificación: 18-07-2017 @jguilindro
               @Params:
                 pregunta -> id de la pregunta a la cual se responde con la imagen
       */
       var output_format = "jpg";
       var source_image = document.getElementById('source_image-'+pregunta);
       var result_image = document.getElementById('result_image-'+pregunta);
       if (source_image.src == "") {
           alert("Debes ingresar una imagen primero!");
           return false;
       }
       var quality = 15;

       $('#source_image-'+pregunta).ready(function(){//Espera a que cargue la imagen para poder realizar la compresion
         result_image.src = jic.compress(source_image,quality,output_format).src;
       });

       $('#result_image-'+pregunta).ready(function(){
         var image_width=$(result_image).width(),
           image_height=$(result_image).height();

         if(image_width > image_height){
           result_image.style.width="320px";
         }else{
           result_image.style.height="300px";
         }
         result_image.style.display = "block";
         App.subirImagen((result_image.src).substring(23), pregunta);//Se convierte el SRC de la imagen comprimida a un formato que el API de imgur pueda leer
       });
     },

     subirImagen: function(imagenSrc, pregunta){
       /*
         @Descripción: Esta función sube la imagen comprimida a imgur y devuelve la url.
         @Autor: @jguilindro
         @FechaModificación: 18-07-2017 @jguilindro
       */
       var clientId = "300fdfe500b1718";
       var xhr = new XMLHttpRequest();
       xhr.open('POST', 'https://api.imgur.com/3/image', true);
       xhr.setRequestHeader('Authorization', 'Client-ID ' + clientId);
       xhr.onreadystatechange = function () {
         if (xhr.status === 200 && xhr.readyState === 4) {
           App.loading(false);
           var url = JSON.parse(xhr.responseText)
           Materialize.toast('Imagen subida exitosamente', 5000, 'rounded');
           console.log('Url de la imagen')
           console.log(url.data.link);//Link de la imagen en imgur

           var idSrcImage = '#source_image-' + pregunta;
           $(idSrcImage).attr('aux', url.data.link);


           var idUrlImagen = '#urlImagen-' + pregunta;
            $(idUrlImagen).text(url.data.link);
            //console.log($(idUrlImagen).text());//Link de la imagen en imgur
           document.getElementById('result_image-'+ pregunta).setAttribute("hidden", false);
         }
         if (xhr.status === 400){
           Materialize.toast('<span style="color: red">Hubo un error al subir la imagen. Intentelo de nuevo.</span>', 5000, 'rounded');
         }
       }
       xhr.send(imagenSrc);//Envia la imagen
     }

   },
  data: {
    tiempo: '',
    leccion: {},
    preguntas: [],
    estudiante: {},
    respuesta: {
      respuesta: '',
      feedback: '',
      calificacion: 0,
      fechaRespuesta: '',
      grupo: '',
      pregunta: '',
      leccion: '',
      imagenes: ''
    },
    respuestas: [],
    corregirHabilitado: false,
    flag: false
  }
});

App.obtenerLogeado()

socket.on('tiempo restante', function(tiempo) {
  App.tiempo = tiempo
})

socket.on('terminado leccion', function(match) {
  App.responderTodas();
})
socket.on('leccion id', function(id_leccion) {
  //App.obtenerLeccion(id_leccion)
  //App.leccionId = id_leccion;
})
socket.on('desconectarlo', function(dato) {
  Materialize.toast('hubo un error llamar', 15000)
})

Offline.options = {
  checkOnLoad: true,
  requests: true,
}


Offline.on('down', function(data) {
  // mostrar mensaje que esta desconectado
  //  Materialize.toast('No esta conectado a internet', 6000)
})

Offline.on('up', function(data) {
  // pedir el tiempo
  // socket.emit('tengo internet', App.estudiante);
})

var interval;
socket.on('connect', function() {
  // interval = setInterval(function () {
  //   socket.emit('conectados', App.estudiante)
  // }, 5000);
  // document.getElementById('desconectado').classList.add("borrar");
  // document.getElementById('conectado').classList.remove("borrar");
  // App.obtenerParaleloDeEstudiante()
  document.getElementById('conectado').classList.remove("red");
  document.getElementById('conectado').classList.add("green");
  $.get({
    url: '/api/session/usuario_conectado',
    success: function(data) {
      socket.emit('reconectar estudiante', data.datos)
    }
  })
})

socket.on('connect_failed', function() {
  console.log('fallo al tratando de recontar');
})

socket.on('disconnect', function() {
  clearInterval(interval)
  // document.getElementById('desconectado').classList.remove("borrar")
  // document.getElementById("conectado").classList.add("borrar");
  document.getElementById('conectado').classList.remove("green");
  document.getElementById('conectado').classList.add("red");
  console.log('desconectado');
})

supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;
if (!supportsWebSockets) {
  Materialize.toast('No Soportado', 6000)
}
