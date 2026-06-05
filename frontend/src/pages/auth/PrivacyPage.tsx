import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/login" className="text-sm text-primary hover:underline mb-8 inline-block">
          ← Volver al inicio de sesión
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-8">Última actualización: junio 2026</p>

        <div className="space-y-6 text-sm text-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Responsable del Tratamiento</h2>
            <p>
              La institución educativa titular de la cuenta en SIE es el responsable del tratamiento
              de los datos personales, de conformidad con la Ley Orgánica de Protección de Datos
              Personales del Ecuador (LOPDP).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Datos que Recolectamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identificación: nombre completo, email, cédula o identificación</li>
              <li>Académicos: calificaciones, asistencia, historial de matrícula</li>
              <li>De NNA: fecha de nacimiento, representante legal, consentimiento parental</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Finalidad del Tratamiento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestión académica: matrícula, calificaciones, asistencia</li>
              <li>Comunicación institucional con estudiantes, docentes y representantes</li>
              <li>Cumplimiento de obligaciones legales ante el Ministerio de Educación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Base Legal</h2>
            <p>
              El tratamiento se fundamenta en el consentimiento del titular (Art. 8 LOPDP),
              la obligación legal de la institución educativa (Art. 7 LOPDP), y el interés
              legítimo en la gestión académica. Para menores de 15 años, se requiere
              autorización expresa del representante legal (Art. 21 LOPDP).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Derechos del Titular (ARCO)</h2>
            <p>
              Como titular de datos personales, tienes derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Acceso:</strong> conocer qué datos tuyos tratamos (Art. 13)</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos (Art. 14)</li>
              <li><strong>Cancelación:</strong> solicitar la eliminación de tus datos (Art. 15)</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento en ciertos casos (Art. 16)</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado (Art. 17)</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, accede al menú de usuario en el sistema y selecciona
              la opción correspondiente, o contacta al Delegado de Protección de Datos (DPD)
              de tu institución.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Conservación de Datos</h2>
            <p>
              Los datos personales se conservan durante el tiempo necesario para cumplir la
              finalidad educativa. Los expedientes académicos se mantienen por un mínimo de
              5 años conforme a la normativa del Ministerio de Educación. Al finalizar el
              plazo, los datos son anonimizados o eliminados de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos:
              cifrado en tránsito (HTTPS), hash de contraseñas (bcrypt), control de acceso
              basado en roles, registro de auditoría, y eliminación lógica (soft delete).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Contacto del DPD</h2>
            <p>
              Para cualquier consulta sobre el tratamiento de tus datos personales, contacta
              al Delegado de Protección de Datos de tu institución educativa a través de los
              canales oficiales.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
