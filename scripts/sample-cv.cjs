/* Datos de prueba compartidos por los scripts de captura. */
module.exports = {
  personalInfo: {
    fullName: 'Juan David Meza Arango',
    title: 'Ingeniero de Sistemas Senior | Backend & Plataformas',
    email: 'juan david.meza.arango@correoelectronico.com',
    phone: '+57 310 555 4433',
    location: 'Medellín, Antioquia, Colombia',
    linkedin: 'linkedin.com/in/juandavidmezaarango',
    website: 'https://juandavidmeza.dev',
    photoUrl: '',
  },
  summary: 'Ingeniero de sistemas con 11 años de experiencia construyendo plataformas de alto volumen y microservicios en Java y Spring Boot. Especialista en confiabilidad, observabilidad y automatización de despliegues. Lideré la migración de un monolito legacy a una arquitectura orientada a eventos que hoy procesa 40 millones de transacciones mensuales.',
  skills: ['Java', 'Spring Boot', 'Kotlin', 'Microservicios', 'Kafka', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'Observabilidad', 'Liderazgo técnico', 'Mentoría'],
  experience: [
    {
      id: 'e1', company: 'Servicios Financieros S.A.S.', position: 'Ingeniero de Plataforma Senior',
      startDate: 'Mar 2021', endDate: '', current: true,
      achievements: [
        'Diseñé y construí la plataforma de pagos que procesa 40 millones de transacciones mensuales con 99,98% de disponibilidad.',
        'Migré 40 microservicios de Java 8 a Java 21 reduciendo el tiempo de arranque un 65%.',
        'Reduje el tiempo medio de recuperación de incidentes de 45 a 8 minutos introduciendo observabilidad con OpenTelemetry.',
        'Diseñé la estrategia de pruebas de contrato adoptada por 7 equipos de producto.',
        'Lideré la mentoría de 5 ingenieros junior durante sus primeros 18 meses en la empresa.',
      ],
    },
    {
      id: 'e2', company: 'Consultora de Tecnología Andina', position: 'Ingeniero de Software Backend',
      startDate: 'Jul 2018', endDate: 'Feb 2021', current: false,
      achievements: [
        'Desarrollé APIs REST y de eventos para clientes del sector retail y financiero.',
        'Automaticé el despliegue con Terraform y GitHub Actions pasando de despliegues mensuales a diarios.',
        'Implementé circuit breakers y reintentos que redujeron los errores en cascada un 38%.',
      ],
    },
    {
      id: 'e3', company: 'Startup de Pagos Digitales', position: 'Desarrollador Backend Jr.',
      startDate: 'Ene 2016', endDate: 'Jun 2018', current: false,
      achievements: [
        'Construí el servicio de conciliación que procesa 1.2 millones de transacciones semanales.',
        'Migré la base de datos de MySQL a PostgreSQL sin pérdida de datos.',
      ],
    },
  ],
  education: [
    { id: 'f1', institution: 'Universidad Nacional de Colombia, Sede Medellín', degree: 'Ingeniería de Sistemas', field: '', startDate: '2010', endDate: '2015', current: false },
    { id: 'f2', institution: 'Instituto Tecnológico Metropolitano', degree: 'Técnico en Programación', field: '', startDate: '2008', endDate: '2010', current: false },
  ],
  languages: [
    { id: 'l1', name: 'Español', level: 'Nativo' },
    { id: 'l2', name: 'Inglés', level: 'Avanzado' },
    { id: 'l3', name: 'Portugués', level: 'Intermedio' },
  ],
  references: [
    { id: 'r1', name: 'María Fernanda Rodríguez', position: 'Directora de Tecnología', company: 'Servicios Financieros S.A.S.', phone: '+57 311 222 3344', email: 'maria.rodriguez@ejemplo.com' },
    { id: 'r2', name: 'Carlos Andrés Pérez', position: 'Gerente de Ingeniería', company: 'Consultora Andina', phone: '+57 312 333 4455', email: 'carlos.perez@ejemplo.com' },
    { id: 'r3', name: 'Lucía Ramírez Ortiz', position: 'CTO', company: 'Startup de Pagos', phone: '+57 313 444 5566', email: 'lucia.ramirez@ejemplo.com' },
  ],
};
