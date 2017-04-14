/*
Flujo: profesorLogeado => obtenerTodosParalelosProfesor => obtenerTodosGrupos => estudiantesNoEnGrupo

 */
// TODO: que no recage todo el dom al eliminar, cambiar de grupo o anadir a grupo
// TODO: al crear un grupo que lo anada a los grupos
var app = new Vue({
	el: '#grupos',
  methods: {
    profesorLogeado: function() {
      this.$http.get(`/api/session/usuario_conectado`).then(response => {
        this.profesor = response.body.datos
        this.obtenerTodosParalelosProfesor()
      }, response => {
        console.error('error')
      });
		},
    obtenerTodosParalelosProfesor: function() {
      this.$http.get(`/api/paralelos/profesores/mis_paralelos`).then(response => {
        this.paralelos = response.body.datos
        if (this.contador_global == 0) {
          this.paralelo_seleccionado = app.paralelos[0]._id
        }
        this.contador_global = this.contador_global + 1
        this.obtenerTodosGrupos()
      }, response => {
        console.error('error')
      });
		},
    obtenerTodosGrupos: function () {
      // limpiar todo
      this.grupos = []
      this.estudiantes = []
      this.estudiantesSinGrupo = []
      var promesas = []
      this.paralelos.forEach(paralelo => {
        if (this.paralelo_seleccionado === paralelo._id) {
          paralelo.grupos.forEach(grupo => {
            promesas.push(new Promise((resolve, reject) => {
              this.$http.get(`/api/grupos/${grupo._id}`).then(response => {
                if (response.body.estado) return resolve(response.body.datos)
                return reject(response.body.datos)
              });
            }))
          })
        }
      })
      Promise.all(promesas).then(result => {
        result.forEach(grupo => {
          this.grupos.push(grupo)
        })
        this.obtenerTodosEstudiantes()
      }, fail => {
        console.log(fail)
      })
    },
    obtenerTodosEstudiantes: function() {
      if (this.grupos.length == 0) {
        this.nuevoGrupo()
      }
      let cont = 0
      this.paralelos.forEach(paralelo => {
        if (paralelo._id == this.paralelo_seleccionado) {
          this.estudiantes = this.paralelos[cont].estudiantes
        }
        cont = cont + 1
      })
      this.estudiantesNoEnGrupo()
    },
    estudiantesNoEnGrupo: function() {
      let temp = []
      this.grupos.forEach( grupo => {
        grupo.estudiantes.forEach( estudiante => {
          temp.push(estudiante._id);
        })
      })
      this.estudiantes.forEach((es) => {
        if (!temp.includes(es._id)) {
          this.estudiantesSinGrupo.push(es)
        }
      })
    },
    anadirEstudianteAGrupo: function(index_grupo,estudiante) {
      var grupo_drop = this.grupos[index_grupo]
      this.$http.post(`/api/grupos/${this.grupos[index_grupo]._id}/estudiantes/${estudiante._id}`).then(response => {
      }, response => {
      });

      this.grupos.forEach(grupo => {
        grupo.estudiantes.forEach(est => {
          if (est._id === estudiante._id) {
            this.$http.delete(`/api/grupos/${grupo._id}/estudiantes/${est._id}`).then(response => {
              if (response.body.estado) {
              }
            }, response => {
              // codigo error
            });
          }
        })
      })

      // limpiar los estudiantes si existen en sin grupo
      this.estudiantesSinGrupo = this.estudiantesSinGrupo.filter(est => est._id != estudiante._id)

      // eliminar estudiante de grupo
      this.grupos = this.grupos.map( grupo => {
        let estudiantes = grupo.estudiantes.filter(est => est._id != estudiante._id )
        grupo.estudiantes = estudiantes
        return grupo
      })

      // anadir estudiante al grupo que se hizo drop
      this.grupos = this.grupos.map( grupoActual =>{
        if (grupoActual._id == grupo_drop._id) {
          grupoActual.estudiantes.push(estudiante)
          return grupoActual
        }
        return grupoActual
      })
    },
    nuevoGrupo() {
      var ultimo_grupo = []
      // var nombre_grupo = $('#grupo-nombre').val()
      // $('#grupo-nombre').val('');
      if (this.grupos != 0) {
        ultimo_grupo = this.grupos[this.grupos.length - 1].nombre.split(' ')
        console.log(ultimo_grupo)
        nombre_grupo = `Grupo ${parseInt(ultimo_grupo[1]) + 1}`
      } else {
        nombre_grupo = `Grupo 1`
      }
      this.$http.post(`/api/grupos`,{nombre: nombre_grupo}).then( res => {
        if (res.body.estado) {
          let nuevo_paralelo = res.body.datos
          this.$http.post(`/api/paralelos/${this.paralelo_seleccionado}/grupos/${nuevo_paralelo._id}`).then(res => {
            if (res.body.estado) {
              //this.obtenerTodosGrupos
              this.grupos.push(nuevo_paralelo)
            }
          })
        }
      })
    },
    eliminarGrupo(id_grupo) {
      this.$http.delete(`/api/paralelos/${this.paralelo_seleccionado}/grupos/${id_grupo}`).
      then(res => {
        if (res.body.estado) {
          let cont = 0
					this.$http.delete(`/api/grupos/${id_grupo}`).
					then(res => {
						this.grupos.forEach(grupo => {
	            if (grupo._id == id_grupo) {
				        this.borrarGrupo(grupo);
	              this.grupos.splice(cont, 1)
	            }
	            cont = cont + 1
	          })
					})
        }
      })
  },
  borrarAlumno(grupo, estudiante) {
	  this.grupos = this.grupos.map( grupo => {
        let estudiantes = grupo.estudiantes.filter(est => est._id != estudiante._id )
        grupo.estudiantes = estudiantes
        return grupo
      })
	  // anadir estudiante a sin grupo
	  this.estudiantesSinGrupo.push(estudiante)
  },
  borrarGrupo(grupo) {
	  if (grupo.estudiantes.length != 0) {
		  this.estudiantesSinGrupo = [...this.estudiantesSinGrupo, ...grupo.estudiantes]
	  }
  },
  guardarGruposParalelo() {
    let cont = 1
    this.paralelos.forEach(paralelo => {
      if (paralelo._id == this.paralelo_seleccionado) {
        this.paralelos[cont].grupos = this.grupos
      }
      cont = cont + 1
    })
  }
  },
	data: {
      grupos: [
      ],
      estudiantesSinGrupo: [
      ],
      estudiantes: [
      ],
      profesor: {
      },
      paralelos: [
      ],
      paralelo_seleccionado: '',
      contador_global: 0
	},
  watch: {
    grupos: function(val) {
      if (this.grupos[this.grupos.length - 1])
        if (this.grupos[this.grupos.length - 1].estudiantes.length != 0 )
          this.nuevoGrupo()
    }
  }
});
app.profesorLogeado()

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

// TODO: mejorar no recarga
function drop(ev, target) {
    ev.preventDefault();
    let estudiante_drop;
    var index_grupo = 0;
    var data = ev.dataTransfer.getData("text");
    app.estudiantes.forEach((estudiante) => {
      if (estudiante._id == data) {
        estudiante_drop = estudiante
      }
    })

    app.grupos.forEach(grupo => {
      if (grupo._id == target.id) {
        app.anadirEstudianteAGrupo(index_grupo,estudiante_drop)
      }
      index_grupo = index_grupo + 1
    })
}

// TODO: mejorar no recarga
function borrarAlumno(event) {
  let i = 0
  let j = 1
  app.grupos.forEach(grupo => {
    grupo.estudiantes.forEach(estudiante => {
      if (estudiante._id == event.id) {
        app.$http.delete(`/api/grupos/${grupo._id}/estudiantes/${estudiante._id}`).then(response => {
          if (response.body.estado) {
            //app.obtenerTodosGrupos()
			app.borrarAlumno(grupo, estudiante)
          }
        }, response => {
          // codigo error
        });
      }
      j = j + 1
    })
    j = 0
    i = i + 1
  })
}

function obtenerParaleloEscogido(element) {
  app.paralelo_seleccionado = element[element.selectedIndex].id
  app.obtenerTodosParalelosProfesor()
}

window.onbeforeunload = function () {
    var grupo  = app.grupos[app.grupos.length - 1]
    $.ajax({
      method: 'DELETE',
      url: `/api/paralelos/${app.paralelo_seleccionado}/grupos/${grupo._id}`
    })
    $.ajax({
      method: 'DELETE',
      url: `/api/grupos/${grupo._id}`
    })
};
